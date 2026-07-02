# 05 - Modelo de Datos y Bases de Datos Políglotas

**QuitoQuest** utiliza una arquitectura de **persistencia políglota**, donde cada microservicio implementa la base de datos que mejor se adapta a sus requerimientos de consistencia, modelo de consulta y velocidad.

---

## 1. Persistencia Relacional: PostgreSQL (o SQLite en local)

Utilizada en los servicios de **Auth**, **Gamification** y **Rewards** debido a la necesidad de consistencia transaccional ACID estricta.

### A. Esquema `UsersDB` (Auth & User Services)
#### Tabla `users`
* `id`: `UUID` (Primary Key)
* `username`: `VARCHAR(50)` (Unique, Not Null)
* `email`: `VARCHAR(100)` (Unique, Not Null)
* `password_hash`: `VARCHAR(255)` (Not Null)
* `created_at`: `TIMESTAMP` (Default NOW)

#### Tabla `roles`
* `id`: `INT` (Primary Key)
* `name`: `VARCHAR(20)` (Unique, Not Null) - e.g., 'TURISTA', 'PARTNER', 'ADMIN_MUNICIPIO'

#### Tabla `user_roles`
* `user_id`: `UUID` (FK -> `users.id`)
* `role_id`: `INT` (FK -> `roles.id`)
* *Restricción*: PK compuesta `(user_id, role_id)`

---

### B. Esquema `GameDB` (Gamification Service)
#### Tabla `user_progress`
* `user_id`: `UUID` (PK, Unique)
* `current_xp`: `INT` (Default 0, Check >= 0)
* `level`: `INT` (Default 1, Check >= 1)
* `updated_at`: `TIMESTAMP`

#### Tabla `missions`
* `id`: `UUID` (PK)
* `title`: `VARCHAR(100)` (Not Null)
* `description`: `TEXT`
* `xp_reward`: `INT` (Check > 0)
* `poi_id`: `VARCHAR(50)` (Not Null - Referencia lógica al Geo Service)
* `is_active`: `BOOLEAN` (Default TRUE)

#### Tabla `user_missions`
* `user_id`: `UUID` (FK)
* `mission_id`: `UUID` (FK -> `missions.id`)
* `status`: `VARCHAR(20)` (e.g., 'IN_PROGRESS', 'COMPLETED')
* `started_at`: `TIMESTAMP`
* `completed_at`: `TIMESTAMP` (Nullable)
* *Restricción*: PK compuesta `(user_id, mission_id)`

#### Tabla `badges`
* `id`: `UUID` (PK)
* `name`: `VARCHAR(50)` (Unique, Not Null)
* `description`: `TEXT`
* `icon_url`: `VARCHAR(255)`

#### Tabla `user_badges`
* `user_id`: `UUID` (FK)
* `badge_id`: `UUID` (FK -> `badges.id`)
* `unlocked_at`: `TIMESTAMP`
* *Restricción*: PK compuesta `(user_id, badge_id)`

---

### C. Esquema `RewardsDB` (Rewards Service)
#### Tabla `partners` (Comercios)
* `id`: `UUID` (PK)
* `name`: `VARCHAR(100)` (Not Null)
* `category`: `VARCHAR(50)` (e.g., 'GASTRONOMIA', 'MUSEO', 'ENTRETENIMIENTO')
* `address`: `VARCHAR(255)`
* `poi_id`: `VARCHAR(50)` (POI más cercano para recomendaciones)

#### Tabla `rewards` (Premios ofertados)
* `id`: `UUID` (PK)
* `partner_id`: `UUID` (FK -> `partners.id`)
* `title`: `VARCHAR(100)` (Not Null)
* `description`: `TEXT`
* `xp_cost`: `INT` (XP requerido para desbloquearlo en catálogo o asignado a misión)
* `is_active`: `BOOLEAN` (Default TRUE)

#### Tabla `coupons` (Cupones emitidos)
* `id`: `UUID` (PK)
* `user_id`: `UUID` (PK lógica)
* `reward_id`: `UUID` (FK -> `rewards.id`)
* `code`: `VARCHAR(20)` (Unique, Not Null) - Código alfanumérico para validación en local comercial.
* `status`: `VARCHAR(20)` (e.g., 'ACTIVE', 'REDEEMED', 'EXPIRED')
* `issued_at`: `TIMESTAMP`
* `redeemed_at`: `TIMESTAMP` (Nullable)

---

## 2. Persistencia No Relacional: MongoDB (o LokiJS/NeDB en local)

Utilizada en los servicios de **Events**, **Recommendations** y **Social** por su flexibilidad de esquema documental y consultas dinámicas.

### A. Colección `events` (Event Service)
```json
{
  "_id": "ObjectId",
  "title": "Noche de Museos - Centro Histórico",
  "description": "Recorrido nocturno por las iglesias del casco colonial con guías teatrales.",
  "location": {
    "type": "Point",
    "coordinates": [-78.5126, -0.2201]
  },
  "address": "García Moreno y Sucre",
  "organizer": "Fundación Museos de la Ciudad",
  "category": "Historia",
  "start_date": "ISODate('2026-08-15T18:00:00Z')",
  "end_date": "ISODate('2026-08-15T23:00:00Z')",
  "is_free": true,
  "created_at": "ISODate('2026-07-02T00:00:00Z')"
}
```
* **Índices**: `2dsphere` en el campo `location` para realizar búsquedas geográficas eficientes de eventos cercanos.

### B. Colección `recommendations` (Recommendation Engine)
```json
{
  "_id": "ObjectId",
  "user_id": "UUID",
  "recommended_pois": [
    { "poi_id": "san_francisco", "score": 0.95 },
    { "poi_id": "la_ronda", "score": 0.82 }
  ],
  "recommended_events": [
    { "event_id": "evt_102", "score": 0.88 }
  ],
  "updated_at": "ISODate('2026-07-02T02:30:00Z')"
}
```

---

## 3. Caché y Almacén En Memoria: Redis

Utilizado para búsquedas geoespaciales veloces, almacenamiento de sesiones JWT, y el cálculo del Leaderboard global del juego.

### A. Geolocalización (Geo Service)
* Estructura: **Redis GEO (Sorted Set Interno)**.
* Key: `quitoquest:pois:locations`
* Comandos aplicados:
  * Registrar POI: `GEOADD quitoquest:pois:locations -78.5143 -0.2206 "san_francisco"`
  * Consultar POIs en radio de 500 metros: `GEORADIUS quitoquest:pois:locations -78.5140 -0.2200 500 m WITHCOORD`

### B. Tabla de Clasificación (Gamification Service)
* Estructura: **Redis Sorted Set (ZSET)**.
* Key: `quitoquest:leaderboard:global`
* Comandos aplicados:
  * Sumar XP a un usuario: `ZINCRBY quitoquest:leaderboard:global 150 "uuid_usuario_1"`
  * Obtener Top 10 Exploradores: `ZREVRANGE quitoquest:leaderboard:global 0 9 WITHSCORES`
  * Obtener ranking de un usuario específico: `ZREVRANK quitoquest:leaderboard:global "uuid_usuario_1"`
