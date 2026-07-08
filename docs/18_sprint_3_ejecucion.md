# 18 - Sprint 3: Gamificación, Scraping de Eventos y Mensajería

## Objetivo del Sprint 3

Agregar el dinamismo de los retos y conectar los servicios de forma asíncrona
mediante el bus de mensajería. Este sprint se apoya sobre la infraestructura
de los Sprints 1 y 2: microservicios Express, gateway centralizado, paquete
compartido `common` (Event Bus con soporte nativo de RabbitMQ) y los flujos
de autenticación, perfiles y geolocalización ya funcionales.

## Punto de partida

Al iniciar el Sprint 3 ya existía un esqueleto funcional heredado del Sprint 1
para `events-service` y `gamification-service` (carga de eventos semilla,
procesamiento de `POI_VISITED`, asignación de XP/insignias y un endpoint de
leaderboard calculado en memoria/JSON). Este sprint se enfocó en cerrar las
brechas reales frente a los 4 entregables pedidos:

| Entregable pedido | Estado antes del Sprint 3 | Trabajo realizado |
|---|---|---|
| `events-service` cargando dinámicamente la agenda cultural | Endpoint `/scrape` que insertaba un evento mock fijo al llamarlo manualmente | Worker de scraping real (`axios` + `cheerio`) con corrida automática por cron y fallback simulado |
| `gamification-service` procesando `POI_VISITED` y actualizando XP de forma eventual | Ya implementado (consumía el evento y sumaba XP en JSON local) | Se mantiene la lógica, se documenta y se conecta al nuevo leaderboard de Redis |
| Canalizaciones de RabbitMQ operativas entre Geo, Gamification y Recompensas | El `EventBus` compartido ya soporta RabbitMQ si `RABBITMQ_URL` está definida, y `docker-compose.yml` ya la define para los tres servicios | Se documenta cómo validar el flujo end-to-end con RabbitMQ real |
| Leaderboard global en Redis Sorted Sets | El endpoint `/leaderboard` ordenaba un JSON local en memoria (sin Redis) | Implementado con `ZINCRBY` / `ZREVRANGE` / `ZREVRANK` reales, con fallback automático al JSON si Redis no está disponible |

## Cambios realizados

### 1. Leaderboard real en Redis Sorted Sets (`gamification-service`)

Archivos nuevos:

```text
backend/services/gamification-service/src/cache/redisClient.js
backend/services/gamification-service/src/services/leaderboardService.js
```

- `redisClient.js` crea una única conexión a Redis (`ioredis`) usando
  `REDIS_URL`, con `retryStrategy` acotado para no colgar el proceso si
  Redis no está disponible en desarrollo local.
- `leaderboardService.js` implementa las operaciones documentadas en
  `docs/05_modelo_datos.md` (sección 3.B):
  - `ZINCRBY quitoquest:leaderboard:global <xp> <userId>` al completar una misión.
  - `HSET quitoquest:leaderboard:usernames` para resolver el nombre del usuario.
  - `ZREVRANGE ... WITHSCORES` para el Top N.
  - `ZREVRANK` / `ZSCORE` para la posición de un usuario puntual.

`src/index.js` de `gamification-service` fue modificado para:

- Llamar a `leaderboardService.addScore(...)` justo después de escribir el
  progreso en `progress.json`, dentro del handler de `POI_VISITED`.
- El endpoint `GET /leaderboard` ahora intenta leer primero de Redis
  (`source: "redis"`); si Redis no responde, cae automáticamente al cálculo
  sobre el JSON local (`source: "local-json-fallback"`), sin romper el flujo.
- Se agregó `GET /leaderboard/:userId/rank` para consultar la posición y XP
  de un usuario específico usando `ZREVRANK`/`ZSCORE`.

Dependencia agregada en `backend/services/gamification-service/package.json`:
`ioredis`.

### 2. Worker de scraping de la agenda cultural (`events-service`)

Archivos nuevos:

```text
backend/services/events-service/src/repositories/eventsRepository.js
backend/services/events-service/src/scrapers/culturaScraper.js
backend/services/events-service/src/jobs/scrapeScheduler.js
```

- `eventsRepository.js` extrae la persistencia JSON a un repositorio con el
  mismo contrato usado en `auth-service`/`user-service`
  (`findAll`, `findById`, `create`, `upsertBySourceId`), listo para migrar a
  MongoDB sin tocar el resto del servicio.
- `culturaScraper.js` intenta descargar y parsear con `cheerio` el portal
  configurado en `CULTURA_SCRAPER_URL`. Si la variable no está definida, si
  el request falla, o si los selectores no encuentran nada (el HTML de
  portales municipales cambia con frecuencia), cae a un conjunto de eventos
  simulados — mismo patrón de resiliencia que ya usa `EventBus` cuando
  RabbitMQ no está disponible.
- `scrapeScheduler.js` ejecuta el scraper con `node-cron` según
  `CULTURA_SCRAPER_CRON` (por defecto cada 15 minutos: `*/15 * * * *`) y
  publica `EVENT_CREATED` solo por los eventos realmente nuevos (usando
  `upsertBySourceId` para evitar duplicados en cada corrida).

`src/index.js` de `events-service` fue reescrito para usar el repositorio en
lugar de leer/escribir el JSON directamente, sembrar los eventos base solo si
la colección está vacía, arrancar el scheduler al bootstrap, y dejar
`POST /scrape` como disparador manual (usa el mismo `culturaScraper.js`).

Dependencias agregadas en `backend/services/events-service/package.json`:
`axios`, `cheerio`, `node-cron`.

Variables de entorno nuevas (opcionales, con valores por defecto seguros):

```text
CULTURA_SCRAPER_URL   # URL del portal a scrapear; si no se define, usa datos simulados
CULTURA_SCRAPER_CRON  # expresión cron; por defecto "*/15 * * * *"
```

### 3. Mensajería RabbitMQ entre Geo, Gamification y Recompensas

No requirió código nuevo: `backend/common/eventBus.js` ya negocia RabbitMQ
automáticamente cuando `RABBITMQ_URL` está definida, y `docker-compose.yml`
ya la define para `geo-service`, `gamification-service` y `reward-service`.
Lo que hace operativo este pipeline en Sprint 3 es que ahora existe tráfico
real de eventos de punta a punta:

```text
geo-service          --POI_VISITED-->      gamification-service
gamification-service --MISSION_COMPLETED--> reward-service
gamification-service --XP_UPDATED-->        (leaderboard actualizado en Redis)
```

## Validación end-to-end

Desde la raíz del proyecto:

```bash
npm install
docker compose up -d rabbitmq redis mongodb postgres broker-service \
  auth-service user-service geo-service events-service \
  gamification-service reward-service gateway
```

1. Registrar e iniciar sesión (Sprint 2) para obtener un `accessToken`.
2. Hacer check-in en un POI:

```http
POST http://localhost:8000/api/v1/geo/check-in
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "poiId": "san_francisco",
  "userLocation": { "lat": -0.22055, "lng": -78.51428 }
}
```

3. Confirmar que `gamification-service` procesó el evento:

```http
GET http://localhost:8000/api/v1/gamification/leaderboard
```

La respuesta debe incluir `"source": "redis"` y el usuario con su XP actualizado.

4. Confirmar en RabbitMQ Management (`http://localhost:15672`,
   usuario/clave `quitoquest`/`QuitoQuest2026!`) que el exchange
   `quitoquest.events` recibió los mensajes `POI_VISITED`,
   `MISSION_COMPLETED` y `XP_UPDATED`.
5. Confirmar que `reward-service` generó el cupón correspondiente:

```http
GET http://localhost:8000/api/v1/rewards/coupons/<userId>
```

6. Disparar manualmente el scraper de eventos y confirmar la agenda cultural:

```http
POST http://localhost:8000/api/v1/events/scrape
GET  http://localhost:8000/api/v1/events
```

## Estado para iniciar Sprint 4

Con Sprint 3, el equipo ya cuenta con:

- Agenda cultural cargada de forma dinámica y periódica (worker con cron).
- Leaderboard global real en Redis Sorted Sets, con fallback resiliente.
- Flujo de eventos de punta a punta entre Geo, Gamification y Recompensas
  operando sobre RabbitMQ cuando la infraestructura Docker está disponible.
- Contratos de repositorio listos para migrar `events-service` a MongoDB y
  `gamification-service` a PostgreSQL sin romper la API pública.

El Sprint 4 puede continuar con:

- Catálogo de recompensas ampliado y validación de cupones en el frontend.
- `recommendation-service` filtrando POIs por intereses del usuario.
- Admin Dashboard en React consumiendo `analytics-service`.
- Migración real de `GameDB` a PostgreSQL y `EventsDB` a MongoDB.
