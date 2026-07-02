# 03 - Arquitectura General de Sistemas Distribuidos

La arquitectura de **QuitoQuest** ha sido diseñada bajo el patrón de **Microservicios Desacoplados**, con un enfoque híbrido de comunicación síncrona (para transacciones en tiempo real) y asíncrona guiada por eventos (para procesos concurrentes y desacoplados).

---

## 1. Diagrama Lógico de la Arquitectura

```
                        [ Cliente Móvil (Flutter) ]       [ Cliente Web (React) ]
                                     │                              │
                                     ▼                              ▼
                              [ HTTPS (REST) ]               [ HTTPS (REST) ]
                                     └──────────────┬───────────────┘
                                                    ▼
                                            ┌───────────────┐
                                            │  API Gateway  │
                                            └───────┬───────┘
                                                    │ (Enrutamiento & Auth)
                                                    ▼
   ┌──────────────────┬─────────────────┬───────────┴───────┬──────────────────┬─────────────────┐
   ▼                  ▼                 ▼                   ▼                  ▼                 ▼
┌───────┐         ┌───────┐         ┌───────┐           ┌────────┐         ┌───────┐        ┌─────────┐
│ Auth  │         │ User  │         │  Geo  │           │ Event  │         │ Reward│        │ Gamific.│
│Service│         │Service│         │Service│           │Service │         │Service│        │ Service │
└───┬───┘         └───┬───┘         └───┬───┘           └───┬────┘         ───┬────┘        └───┬─────┘
    ▼                 ▼                 ▼                   ▼                 ▼                 ▼
[Postgres]        [Postgres]        [RedisGEO]          [MongoDB]          [Postgres]       [Postgres]
(UsersDB)         (Profiles)        (Spatial)           (EventsDB)         (Coupons)        (ScoresDB)
                                                                                                │
                                                                                                ▼
                                                                                            [RedisRank]
                                                                                            (Leaderbd)
```

---

## 2. Componentes de la Arquitectura Distribuida

### A. Capa de Presentación (Frontend Layer)
* **App Móvil (Flutter / .NET MAUI)**: Consumidor principal de la experiencia. Consume la API Gateway para visualizar el mapa y las misiones. Sostiene el modo offline básico encolando tareas de check-in localmente.
* **Panel de Control (React.js)**: Dashboard SPA moderno enfocado en la administración B2B para comercios asociados (cargar promociones, validar códigos) y analítica municipal (métricas de visitas).

### B. Capa de Enlace (API Gateway Layer)
* Un punto de entrada único (Nginx o Express Gateway) que intercepta todas las peticiones HTTPS externas.
* **Responsabilidades**:
  * Autenticación Centralizada: Valida los JWT de las cabeceras e inyecta la identidad del usuario (`userId`, `role`) a los servicios aguas abajo.
  * Rate Limiting: Limita peticiones por IP usando una caché Redis para mitigar ataques DDoS.
  * Routing: Enruta dinámicamente `/api/v1/auth/*` a `auth-service`, `/api/v1/geo/*` a `geo-service`, etc.

### C. Capa de Microservicios Núcleo (Core Services)
Cada microservicio es un contenedor autónomo con su propia lógica de negocio y su propia base de datos (**Database-per-Service Pattern**), lo cual evita el acoplamiento a nivel de datos:
1. **Auth Service**: Registro de usuarios y generación de tokens de sesión.
2. **User Service**: Gestión del perfil gamer del usuario e intereses.
3. **Geo Service**: Lógica de geofencing y validación de visitas a checkpoints geográficos.
4. **Event Service**: Scraping de agendas culturales de la ciudad de Quito y APIs externas.
5. **Gamification Service**: Gestión de la lógica de niveles, XP, insignias y el ranking global.
6. **Rewards Service**: Módulo transaccional de cupones para negocios aliados.
7. **Recommendation Engine**: Generación de recomendaciones personalizadas de rutas.
8. **Notification Service**: Envío de avisos instantáneos (WebSockets / Push).
9. **Analytics Service**: Pipeline de almacenamiento y modelado de datos para dashboards.

---

## 3. Capa de Mensajería Distribuida (Event-Driven Broker)

El sistema utiliza comunicación asíncrona para propagar cambios de estado sin bloquear las solicitudes HTTP del usuario final.

```
┌────────────────────┐                        ┌─────────────┐                        ┌────────────────────┐
│ Gamification Serv. │ ── MISSION_COMPLETED ─>│  RabbitMQ   │── MISSION_COMPLETED ─> │  Rewards Service   │
│                    │                        │ (Event Bus) │                        │ (Genera Cupón)     │
└────────────────────┘                        └──────┬──────┘                        └────────────────────┘
                                                     │
                                                     ▼ MISSION_COMPLETED
                                              ┌─────────────┐
                                              │Social/Notif.│ (Push/Websocket Notification)
                                              └─────────────┘
```

* **RabbitMQ**: Utilizado para eventos transaccionales de alta fiabilidad y consistencia eventual (ej. `MISSION_COMPLETED` dispara la generación de un cupón en el servicio de recompensas y notifica al usuario final por WebSocket).
* **Apache Kafka**: Utilizado como canal de streams de datos en tiempo real de telemetría (ubicación del usuario, historial de clicks) para alimentar el motor de recomendaciones y el microservicio de analítica.

---

## 4. Patrones de Diseño Distribuidos Aplicados

Para mitigar los fallos inherentes a las redes distribuidas, se implementan los siguientes patrones de resiliencia:
* **Circuit Breaker**: Si el `Recommendation Engine` se cae debido a sobrecarga, el API Gateway activa un fallback retornando una lista estática de lugares populares de Quito en lugar de fallar con un error 500.
* **Consistencia Eventual & Outbox Pattern**: Al completarse una misión, los cambios de XP se escriben en la base de datos local del microservicio de gamificación junto con un mensaje en la tabla "Outbox" en una única transacción atómica. Un worker procesa la tabla Outbox y publica en RabbitMQ de forma garantizada (*At-Least-Once delivery*).
* **Caching Distribuido (Redis)**: La tabla de posiciones (Leaderboard) se procesa dinámicamente mediante Redis Sorted Sets (`ZADD`, `ZREVRANGE`), evitando sobrecargar la base de datos PostgreSQL principal con costosas operaciones de agregación y ordenación en cada visualización.
