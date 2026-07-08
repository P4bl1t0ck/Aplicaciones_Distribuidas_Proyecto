# 16 - Sprint 1: Ejecucion local e infraestructura base

## Objetivo del Sprint 1

El Sprint 1 deja lista la base tecnica para que el equipo pueda trabajar sobre el monorepo de QuitoQuest con infraestructura local, microservicios dockerizados, paquete compartido `common`, gateway de entrada y panel web administrativo.

## Cambios realizados

### 1. Correccion de construccion Docker en monorepo

Se ajusto `docker-compose.yml` para que los servicios Node.js se construyan desde la raiz del proyecto. Esto permite que Docker tenga acceso al paquete compartido `backend/common`, requerido por los microservicios.

Servicios ajustados:

- `broker-service`
- `auth-service`
- `user-service`
- `geo-service`
- `events-service`
- `gamification-service`
- `reward-service`
- `notification-service`
- `recommendation-service`
- `analytics-service`
- `gateway`

### 2. Ajuste de Dockerfiles de microservicios

Los Dockerfiles de los servicios fueron adaptados al contexto de monorepo:

- Copian `package.json` y `package-lock.json` desde la raiz.
- Copian `backend/common` cuando el servicio depende del paquete compartido.
- Copian solo el codigo del servicio correspondiente.
- Instalan dependencias con `npm install --workspace=... --omit=dev`.
- Ejecutan cada servicio desde `src/index.js`.

Con esto se resolvio el error:

```text
npm error notarget No matching version found for common@^1.0.0
```

### 3. Correccion del API Gateway

Se corrigio el arranque del gateway dentro de Docker. Antes intentaba ejecutar:

```text
/app/backend/gateway/index.js
```

pero el archivo real esta en:

```text
backend/gateway/src/index.js
```

Tambien se parametrizaron las URLs internas de servicios mediante variables de entorno para que el gateway use los nombres DNS de Docker Compose, por ejemplo:

```text
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
GEO_SERVICE_URL=http://geo-service:3003
```

Esto evita que el gateway intente comunicarse con `localhost` dentro del contenedor.

### 4. Healthcheck publico del gateway

Se dejo el endpoint:

```text
GET http://localhost:8000/health
```

fuera de la validacion JWT para poder verificar rapidamente que el gateway esta vivo.

Respuesta esperada:

```json
{
  "status": "healthy",
  "gateway": "active",
  "routesRegistered": [
    "auth",
    "user",
    "geo",
    "events",
    "gamification",
    "reward",
    "recommendation",
    "analytics"
  ]
}
```

### 5. Correccion de RabbitMQ en analytics

Se corrigio un typo en `analytics-service`:

```text
quitoqueue -> quitoquest
```

La URL correcta queda:

```text
RABBITMQ_URL=amqp://quitoquest:QuitoQuest2026!@rabbitmq:5672
```

### 6. Panel de control web

Se agrego el script:

```bash
npm run dev:panel
```

como alias del workspace `admin-panel`.

El panel se levanta en:

```text
http://localhost:5173
```

## Dependencias necesarias para los integrantes

Cada integrante debe tener instalado:

- Git
- Node.js 18 o superior
- npm
- Docker Desktop
- Docker Compose
- Un editor de codigo, recomendado Visual Studio Code

Opcional para pruebas:

- Postman, Insomnia o Thunder Client
- Cliente PostgreSQL como DBeaver o pgAdmin
- Cliente MongoDB como MongoDB Compass
- Cliente Redis si se requiere inspeccion manual

## Instalacion inicial del proyecto

Desde la raiz del repositorio:

```bash
npm install
```

Esto instala las dependencias del monorepo y sus workspaces:

- `backend/common`
- `backend/gateway`
- `backend/services/*`
- `admin-panel`

## Ejecucion con Docker

Para construir todas las imagenes:

```bash
docker compose build
```

Para levantar la infraestructura y los servicios:

```bash
docker compose up -d
```

Para ver logs:

```bash
docker compose logs -f
```

Para detener todo:

```bash
docker compose down
```

## Servicios expuestos

Infraestructura:

- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- RabbitMQ AMQP: `localhost:5672`
- RabbitMQ Management: `http://localhost:15672`

Backend:

- Broker Service: `http://localhost:5000`
- Auth Service: `http://localhost:3001`
- User Service: `http://localhost:3002`
- Geo Service: `http://localhost:3003`
- Events Service: `http://localhost:3004`
- Gamification Service: `http://localhost:3005`
- Reward Service: `http://localhost:3006`
- Notification Service: `http://localhost:3007`
- Recommendation Service: `http://localhost:3008`
- Analytics Service: `http://localhost:3009`
- API Gateway: `http://localhost:8000`

Frontend:

- Admin Panel: `http://localhost:5173`

## Comandos utiles para desarrollo

Levantar solo el panel web:

```bash
npm run dev:panel
```

Levantar el gateway fuera de Docker:

```bash
npm run dev:gateway
```

Levantar todos los servicios backend fuera de Docker:

```bash
npm run start:backend
```

## Validaciones realizadas

Se valido lo siguiente:

- `docker compose config` carga correctamente.
- `node --check backend/gateway/src/index.js` no reporta errores de sintaxis.
- `docker compose build` construye todas las imagenes.
- `docker compose up -d` levanta los contenedores.
- `GET http://localhost:8000/health` responde `200 OK`.
- `GET http://localhost:5173` responde `200 OK`.
- El gateway registra en logs que esta corriendo en el puerto `8000`.

## Estado para iniciar Sprint 2

El equipo ya puede trabajar sobre:

- Autenticacion y usuarios desde `auth-service` y `user-service`.
- Geolocalizacion desde `geo-service`.
- Gateway como punto de entrada unificado.
- Mensajeria comun con `backend/common`.
- Panel web administrativo en React.

Antes de empezar Sprint 2, cada integrante debe confirmar que puede ejecutar:

```bash
npm install
docker compose build
docker compose up -d
npm run dev:panel
```

Y validar:

```text
http://localhost:8000/health
http://localhost:5173
```
