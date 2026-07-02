# 04 - Diseño Detallado de Microservicios

Cada microservicio en la arquitectura de **QuitoQuest** es autónomo, se desarrolla con un enfoque modular, posee su propio almacén de persistencia (políglota) y se comunica mediante contratos bien definidos.

---

## 1. Auth Service (Servicio de Autenticación)

* **Responsabilidad**: Registrar y autenticar usuarios, firmar tokens JWT, gestionar Refresh Tokens, validar roles y controlar las sesiones del usuario.
* **Tecnología**: Node.js / Express, PostgreSQL (o SQLite en fallback), `jsonwebtoken`, `bcrypt`.
* **Endpoints Clave**:
  * `POST /api/v1/auth/register`: Crea un nuevo usuario y propaga el evento `USER_CREATED`.
  * `POST /api/v1/auth/login`: Autentica credenciales y retorna un Access Token (corto plazo, 15 min) y un Refresh Token (largo plazo, 7 días).
  * `POST /api/v1/auth/refresh`: Renueva el token de acceso si el Refresh Token es válido.
  * `POST /api/v1/auth/logout`: Revoca el Refresh Token actual.
* **Eventos Publicados**:
  * `USER_CREATED`: Publicado en RabbitMQ. Datos: `{ userId, email, username }`.
* **Persistencia**: `UsersDB` (PostgreSQL) con tablas de `users`, `roles`, y `refresh_tokens`.

---

## 2. User Service (Servicio de Usuarios)

* **Responsabilidad**: Gestionar el perfil lúdico de los usuarios (avatar, nivel, biografía) y almacenar sus preferencias e intereses turísticos.
* **Tecnología**: Node.js / Express, PostgreSQL.
* **Endpoints Clave**:
  * `GET /api/v1/users/profile`: Obtiene la información del perfil del usuario autenticado.
  * `PUT /api/v1/users/profile`: Actualiza datos básicos y avatar.
  * `GET /api/v1/users/interests`: Recupera las preferencias actuales (Gastronomía, Arte, etc.).
  * `PUT /api/v1/users/interests`: Reconfigura los intereses preferenciales del usuario.
* **Eventos Consumidos**:
  * `USER_CREATED`: Crea el registro de perfil inicial del usuario en blanco.
* **Persistencia**: `ProfilesDB` (PostgreSQL / SQLite).

---

## 3. Geo Service (Servicio de Geolocalización)

* **Responsabilidad**: Gestionar los metadatos geográficos de los puntos de interés turísticos (POIs), calcular distancias espaciales y validar que el usuario se encuentre físicamente en un checkpoint para mitigar fraudes de GPS.
* **Tecnología**: Node.js / Express, Redis GEO.
* **Endpoints Clave**:
  * `GET /api/v1/geo/pois`: Retorna todos los checkpoints geográficos activos en Quito (ej. Plaza Grande, Basílica, Panecillo).
  * `GET /api/v1/geo/pois/nearby?lat={lat}&lng={lng}&radius={m}`: Utiliza el índice espacial Redis GEO para encontrar puntos de interés en un radio específico.
  * `POST /api/v1/geo/check-in`: Valida la latitud y longitud enviada por el dispositivo móvil contra las coordenadas del POI seleccionado. Si está en rango, emite el evento `POI_VISITED`.
* **Eventos Publicados**:
  * `POI_VISITED`: Datos: `{ userId, poiId, timestamp }`.
* **Persistencia**: `GeoDB` (Redis GEO y caché local).

---

## 4. Event Service (Servicio de Eventos)

* **Responsabilidad**: Cargar y distribuir la agenda cultural de Quito (conciertos, ferias gastronómicas, horarios especiales de museos). Cuenta con workers que realizan scraping de datos de portales culturales del municipio de forma asíncrona.
* **Tecnología**: Node.js / Python, MongoDB (o LokiJS/NeDB en fallback).
* **Endpoints Clave**:
  * `GET /api/v1/events`: Lista todos los eventos culturales activos.
  * `GET /api/v1/events/:id`: Obtiene el detalle completo de un evento.
  * `POST /api/v1/events`: Permite a los administradores municipales crear un evento.
* **Eventos Publicados**:
  * `EVENT_CREATED`: Notifica la creación de un nuevo evento.
* **Persistencia**: `EventsDB` (MongoDB).

---

## 5. Gamification Service (Servicio de Gamificación)

* **Responsabilidad**: Controlar las reglas de los retos y misiones del juego. Computar la ganancia de puntos de experiencia (XP), otorgar insignias (badges) cuando se cumplan condiciones y gestionar la tabla de posiciones global.
* **Tecnología**: Node.js / Express, PostgreSQL y Redis Sorted Sets para el Leaderboard.
* **Endpoints Clave**:
  * `GET /api/v1/gamification/missions`: Lista misiones activas y el progreso del usuario.
  * `GET /api/v1/gamification/leaderboard`: Obtiene el ranking top de exploradores de Quito utilizando Redis Sorted Sets de alta velocidad.
  * `GET /api/v1/gamification/badges`: Consulta las insignias desbloqueadas por el usuario.
* **Eventos Consumidos**:
  * `POI_VISITED`: Incrementa el progreso de la misión activa relacionada con el POI visitado. Si la misión se completa, otorga XP y emite `MISSION_COMPLETED`.
* **Eventos Publicados**:
  * `MISSION_COMPLETED`: Datos: `{ userId, missionId, xpEarned, timestamp }`.
  * `XP_UPDATED`: Datos: `{ userId, newXP, newLevel }`.
* **Persistencia**: `GameDB` (PostgreSQL) y `RankingsCache` (Redis).

---

## 6. Reward Service (Servicio de Recompensas)

* **Responsabilidad**: Gestionar el catálogo de beneficios que los comercios asociados (partners) suben al sistema. Emitir cupones digitales con códigos únicos y validar el canje físico de los mismos.
* **Tecnología**: Node.js / Express, PostgreSQL.
* **Endpoints Clave**:
  * `GET /api/v1/rewards/catalog`: Muestra las recompensas y cupones disponibles en el marketplace.
  * `POST /api/v1/rewards/redeem`: Permite a un usuario canjear sus puntos o completar una misión para obtener un cupón firmado.
  * `POST /api/v1/rewards/validate`: Endpoint utilizado por los comercios aliados para registrar el uso del cupón introduciendo el código único.
* **Eventos Consumidos**:
  * `MISSION_COMPLETED` o `XP_UPDATED`: Evalúa si el usuario califica para recibir un cupón especial y lo guarda en su inventario.
* **Eventos Publicados**:
  * `REWARD_CLAIMED`: Notifica que se ha reclamado exitosamente un cupón.
* **Persistencia**: `RewardsDB` (PostgreSQL).

---

## 7. Recommendation Engine (Motor de Recomendaciones)

* **Responsabilidad**: Procesar el historial de visitas de los usuarios y cruzarlo con sus intereses seleccionados para recomendar qué POIs, restaurantes o eventos culturales visitar a continuación.
* **Tecnología**: Python / FastAPI (o Node.js/Simple Matcher), MongoDB (BehaviorDB).
* **Endpoints Clave**:
  * `GET /api/v1/recommendations`: Retorna un listado de POIs y eventos recomendados para el usuario actual.
* **Persistencia**: `BehaviorDB` (MongoDB/NeDB) que almacena clicks, visitas completadas y afinidades del usuario.

---

## 8. Social & Notification Service (Servicio Social y Notificaciones)

* **Responsabilidad**: Proveer el sistema de amigos y disparar notificaciones push y alertas en tiempo real (Toasts) en la aplicación móvil o web.
* **Tecnología**: Node.js, Socket.io, Firebase Cloud Messaging.
* **Endpoints Clave**:
  * `GET /api/v1/social/friends`: Obtiene los amigos del usuario.
  * `POST /api/v1/social/friends/add`: Envía solicitud de amistad.
* **Eventos Consumidos**:
  * `XP_UPDATED`, `MISSION_COMPLETED`, `REWARD_CLAIMED`: Escucha los canales del Event Bus para disparar notificaciones en tiempo real a través de WebSockets (`socket.emit`) al frontend.
* **Persistencia**: `SocialDB` (MongoDB/LokiJS).

---

## 9. Analytics Service (Servicio de Analítica)

* **Responsabilidad**: Capturar todo el flujo de eventos del sistema (tracking de ubicaciones, canjes de cupones, búsquedas) para modelar estadísticas de tráfico peatonal urbano, horas pico de visitas por distrito y efectividad de campañas B2B.
* **Tecnología**: Node.js / Python, Kafka Consumer, Data Warehouse (PostgreSQL optimizado o MongoDB).
* **Endpoints Clave**:
  * `GET /api/v1/analytics/b2b/summary`: Retorna KPIs para los comercios (cuántos usuarios han visto su promoción, visitas físicas acumuladas).
  * `GET /api/v1/analytics/admin/heatmap`: Retorna agregaciones de geolocalización para mapas de calor del municipio.
* **Eventos Consumidos**: Consumidor de streams de Apache Kafka y RabbitMQ.
* **Persistencia**: `DataWarehouseDB` (PostgreSQL / MongoDB).
