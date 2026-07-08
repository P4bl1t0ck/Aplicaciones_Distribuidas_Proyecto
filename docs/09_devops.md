# 09 - DevOps, Contenedores y CI/CD

El despliegue de **QuitoQuest** sigue principios de infraestructura como código (IaC) e integración continua. Todo el ecosistema de microservicios está virtualizado, facilitando la consistencia de entornos desde desarrollo hasta producción.

---

## 1. Virtualización con Docker

Cada servicio (incluyendo el API Gateway y el panel React) posee un `Dockerfile` optimizado en múltiples etapas (Multi-stage build) para mantener imágenes ligeras y seguras.

### Dockerfile de Producción (Ejemplo de Node.js Service)
```dockerfile
# Etapa 1: Construcción
FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .

# Etapa 2: Ejecución
FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/src ./src
USER node
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
```

---

## 2. Orquestación Local: Docker Compose

Para levantar toda la arquitectura con un solo comando en entornos de desarrollo, se diseña un archivo `docker-compose.yml` que enlaza las dependencias:

```yaml
version: '3.8'

services:
  # Bases de datos y brokers
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: quitoquest
      POSTGRES_PASSWORD: SecretPassword
    ports:
      - "5432:5432"

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"

  # Microservicios
  gateway:
    build: ./gateway
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - geo-service

  auth-service:
    build: ./services/auth-service
    environment:
      DATABASE_URL: postgres://postgres:SecretPassword@postgres:5432/quitoquest
      RABBITMQ_URL: amqp://rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
```

---

## 3. Orquestación Empresarial: Kubernetes (K8s)

Para entornos de producción reales, los contenedores se ejecutan en un clúster Kubernetes (p. ej., Minikube local o AWS EKS).

### Componentes K8s del Ecosistema:
* **Deployments**: Define la cantidad de réplicas para cada microservicio, políticas de actualización progresiva (RollingUpdate) y sondas de salud (`livenessProbe` y `readinessProbe` apuntando a `/health`).
* **ClusterIP Services**: Habilita la resolución DNS interna entre microservicios (nombramiento distribuido) sin exponerlos a internet.
* **Nginx Ingress Controller**: Ruta el tráfico público del puerto 80/443 de la IP del clúster hacia el contenedor de la `API Gateway` basándose en reglas de hosts (ej. `api.quitoquest.ec`).
* **Horizontal Pod Autoscaler (HPA)**: Monitorea el consumo de CPU/Memoria y replica de forma dinámica las instancias del `geo-service` o `gamification-service` durante fines de semana de alta concurrencia.

---

## 4. Pipeline de CI/CD (GitHub Actions)

Al realizar un push a las ramas `main` o `develop`, se dispara el workflow automatizado:
1. **Linter & Test**: Ejecuta validaciones de código y pruebas unitarias de los servicios en paralelo.
2. **Build Docker**: Compila las imágenes Docker de los servicios modificados.
3. **Registry Push**: Sube las imágenes a Docker Hub con la etiqueta del hash de commit.
4. **Deploy Staging**: Aplica los manifiestos K8s actualizando las imágenes en el clúster de pruebas.
