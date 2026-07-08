# 17 - Sprint 2: Autenticacion, usuarios y geolocalizacion

## Objetivo del Sprint 2

El Sprint 2 implementa el flujo core del MVP para que un turista pueda registrarse, iniciar sesion, administrar sus intereses de perfil y validar visitas a checkpoints geograficos de Quito a traves del API Gateway.

Este sprint se apoya sobre la infraestructura local del Sprint 1: microservicios Express, gateway centralizado, paquete compartido `common` y bus de eventos para comunicar servicios.

## Cambios realizados

### 1. Ajuste del contrato de registro e inicio de sesion

Se actualizo `auth-service` para alinear las respuestas con el contrato documentado:

- `POST /api/v1/auth/register` devuelve `success`, `message`, `userId` y el objeto `user`.
- `POST /api/v1/auth/login` devuelve `accessToken`, `refreshToken` y datos basicos del usuario.
- El token JWT mantiene los claims `userId`, `username` y `role`.
- La contrasena sigue almacenandose con hash Bcrypt mediante `bcryptjs`.

Tambien se sincronizo la conexion del `EventBus` antes de publicar `USER_CREATED`, reduciendo el riesgo de publicar antes de que el bus este listo.

### 2. Perfil de usuario autenticado

Se amplio `user-service` con rutas orientadas al usuario autenticado:

```text
GET /profile/me
PUT /profile/me
```

Estas rutas leen el id del usuario desde la cabecera interna:

```text
x-user-id
```

El gateway inyecta esta cabecera despues de validar el JWT. Esto evita que el cliente tenga que enviar manualmente su propio `userId`.

Tambien se mejoro la administracion de intereses:

- Los intereses deben enviarse como arreglo de texto.
- Los valores se normalizan a mayusculas.
- Los campos omitidos no sobrescriben datos existentes con `undefined`.
- Si un usuario se registra pero su perfil aun no existe, el servicio lo crea automaticamente con intereses por defecto para evitar errores en el flujo inicial.
- Se mantienen las rutas historicas `GET /profile/:userId` y `PUT /profile/:userId` para pruebas internas.

### 3. Geolocalizacion y calculo Haversine

Se completo `geo-service` con el endpoint:

```text
GET /pois/nearby?lat=-0.2206&lng=-78.5143&radius=1000
```

La respuesta devuelve POIs ordenados por cercania, con:

- `poiId`
- `name`
- `description`
- `distanceMeters`
- `coordinates`

El calculo de distancia utiliza la formula Haversine y filtra los resultados segun el radio solicitado.

### 4. Check-in autenticado por Gateway

Se actualizo:

```text
POST /check-in
```

El servicio ahora toma `userId` desde `x-user-id`, inyectado por el gateway, y conserva compatibilidad con `userId` en el cuerpo para pruebas directas del microservicio.

Reglas aplicadas:

- `poiId` es obligatorio.
- `userLocation.lat` y `userLocation.lng` deben ser coordenadas numericas.
- El checkpoint se valida con un radio maximo de 50 metros.
- Si la ubicacion esta dentro del radio, se publica el evento `POI_VISITED`.
- Si la ubicacion esta fuera del radio, se devuelve `verified: false` con la distancia calculada.

### 5. Reglas publicas y protegidas del Gateway

Se ajusto `gateway` para mantener protegidas las operaciones sensibles y permitir consultas publicas del mapa:

Publicas:

```text
GET /health
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/geo/pois
GET /api/v1/geo/pois/nearby
GET /api/v1/gamification/leaderboard
```

Protegidas con JWT:

```text
GET /api/v1/users/profile/me
PUT /api/v1/users/profile/me
POST /api/v1/geo/check-in
```

### 6. Ajustes de estabilidad para pruebas locales

Durante la validacion local se identifico que el flujo de eventos entre servicios podia fallar al iniciar si el broker mock no estaba listo a tiempo. Para estabilizar las pruebas se aplicaron ajustes para:

- Esperar la conexion del broker antes de publicar o suscribirse a eventos.
- Usar un puerto alterno para el broker mock local (`5010`) para evitar conflictos con otros procesos de la maquina.
- Crear un perfil por defecto al consultar `/profile/me` si aun no existia, permitiendo validar el flujo completo aunque la sincronizacion de eventos llegue con retraso.

Esto deja el backend en un estado mas robusto para el desarrollo y las demostraciones locales.

## Endpoints principales del Sprint 2

### Registro

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "username": "pablomont10",
  "email": "pablo@quitoquest.com",
  "password": "PasswordSegura123!"
}
```

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "pablo@quitoquest.com",
  "password": "PasswordSegura123!"
}
```

### Actualizar intereses

```http
PUT /api/v1/users/profile/me
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "interests": ["historia", "gastronomia", "museos"],
  "bio": "Turista interesado en el Centro Historico de Quito."
}
```

### Buscar checkpoints cercanos

```http
GET /api/v1/geo/pois/nearby?lat=-0.22056&lng=-78.51429&radius=300
```

### Realizar check-in

```http
POST /api/v1/geo/check-in
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "poiId": "san_francisco",
  "userLocation": {
    "lat": -0.22056,
    "lng": -78.51429
  }
}
```

## Persistencia usada en esta entrega

Para esta entrega local, `auth-service` y `user-service` mantienen repositorios JSON en:

```text
backend/.local_db/users.json
backend/.local_db/profiles.json
```

Esto permite probar el flujo sin agregar nuevas dependencias. El contrato de repositorios queda preparado para migrar a PostgreSQL o SQLite en el siguiente ajuste tecnico, usando las mismas operaciones de `findByEmail`, `findByUserId`, `create` y `createOrUpdate`.

## Validaciones propuestas

Desde la raiz del proyecto:

```bash
npm install
docker compose up -d broker-service auth-service user-service geo-service gateway
```

Luego validar:

```text
GET  http://localhost:8000/health
POST http://localhost:8000/api/v1/auth/register
POST http://localhost:8000/api/v1/auth/login
GET  http://localhost:8000/api/v1/geo/pois/nearby?lat=-0.22056&lng=-78.51429&radius=300
PUT  http://localhost:8000/api/v1/users/profile/me
POST http://localhost:8000/api/v1/geo/check-in
```

## Estado para iniciar Sprint 3

Con Sprint 2, el equipo ya cuenta con:

- Usuario registrado y autenticado mediante JWT.
- Perfil de usuario con intereses administrables.
- Checkpoints turisticos consultables por cercania.
- Geofencing funcional con radio de 50 metros.
- Evento `POI_VISITED` emitido cuando el check-in es valido.
- Gateway separando rutas publicas y rutas protegidas.

El Sprint 3 puede continuar con:

- Procesamiento de `POI_VISITED` en `gamification-service`.
- Asignacion de XP y misiones completadas.
- Leaderboard dinamico.
- Integracion del flujo de recompensas sobre eventos transaccionales.
- Mejorar la resiliencia del bus de eventos y la persistencia de perfiles para escenarios reales de produccion.
