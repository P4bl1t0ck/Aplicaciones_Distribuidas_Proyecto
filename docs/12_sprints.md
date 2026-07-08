# 12 - Planificación de Sprints y Scrum Backlog

El desarrollo del proyecto se planifica en un ciclo ágil de **5 Sprints** (2 semanas por sprint, totalizando 10 semanas teóricas que corresponden a las 8 semanas de desarrollo del MVP práctico más documentación inicial y final).

---

## 1. División de Trabajo por Integrante

| Integrante | Rol Técnico | Responsabilidades Específicas |
| --- | --- | --- |
| **Integrante 1: Pablo Montalvo** | Lead Backend Security | API Gateway, `auth-service`, `user-service`, cifrado, firma de JWT, gestión de roles (RBAC). |
| **Integrante 2: Patricio Saa** | GIS & Data Integration Engineer | `geo-service` (Redis GEO), `events-service` (MongoDB), scrapers de eventos, integración de APIs (OpenWeather, OpenStreetMap). |
| **Integrante 3: Carlos Moreta** | Core Gamification Engineer | `gamification-service` (PostgreSQL / SQLite), `reward-service` (catálogo y canjes), mensajería RabbitMQ (eventos transaccionales). |
| **Integrante 4: Josué Cevallos** | Data & Analytics Engineer | `recommendation-service` (LokiJS/MongoDB), `analytics-service` (Data Warehouse), flujos de Kafka para logs de tracking. |
| **Integrante 5: Alexander Cahueñas**| Fullstack UI & DevOps Engineer | Frontend móvil (Flutter skeleton), frontend web (React admin panel), virtualización Docker, configs de K8s, y CI/CD. |

---

## 2. Cronograma de Sprints

### Sprint 1: Cimientos del Entorno e Infraestructura (Semanas 1-2)
* **Objetivo**: Configurar el monorepo, levantar las bases de datos en local/Docker, definir las interfaces comunes y estructurar los directorios.
* **Entregables**:
  - Repositorio Git inicializado y vinculado al origen remoto de GitHub.
  - Archivo `docker-compose.yml` para bases de datos (Postgres, Mongo, Redis, RabbitMQ).
  - Paquete `backend/common` con lógica de Event Bus.
  - Skeletons de las carpetas de los microservicios y proyectos de frontend.

### Sprint 2: Core de Autenticación, Usuarios y Geolocalización (Semanas 3-4)
* **Objetivo**: Implementar el registro, el login y la lógica espacial de geofencing.
* **Entregables**:
  - `auth-service` con persistencia en Postgres/SQLite (cifrado Bcrypt listo).
  - API Gateway configurado para redirigir peticiones y rechazar accesos sin token.
  - `geo-service` con carga de checkpoints e implementación del cálculo Haversine de cercanía.
  - `user-service` administrando los intereses del perfil.

### Sprint 3: Gamificación, Scraping de Eventos y Mensajería (Semanas 5-6)
* **Objetivo**: Agregar el dinamismo de los retos y conectar los servicios de forma asíncrona mediante el bus de mensajería.
* **Entregables**:
  - `events-service` cargando dinámicamente actividades de la agenda cultural.
  - `gamification-service` procesando el evento `POI_VISITED` y actualizando XP de forma eventual.
  - Canalizaciones de RabbitMQ operativas entre Geo, Gamification, y Recompensas.
  - Leaderboard global alimentado dinámicamente en Redis Sorted Sets.

### Sprint 4: Catálogo de Recompensas, Recomendación y Frontends (Semanas 7-8)
* **Objetivo**: Construir el marketplace, integrar la recomendación inteligente de rutas y programar las interfaces gráficas.
* **Entregables**:
  - `reward-service` gestionando la emisión y validación de cupones alfanuméricos.
  - `recommendation-service` filtrando lugares basados en intereses del perfil del usuario.
  - Admin Dashboard en React consumiendo los endpoints de analítica de visitas.
  - Aplicación Flutter mostrando el mapa interactivo de Leaflet y los desafíos gamificados.

### Sprint 5: Aseguramiento de Calidad y Cierre (Semanas 9-10)
* **Objetivo**: Pruebas de carga, control de consistencia eventual, y empaquetamiento final para la presentación.
* **Entregables**:
  - Scripts de prueba de carga con Artillery ejecutados contra el Gateway.
  - Manual de instalación y documentación final completada.
  - Video demostrativo y presentación académica pulida.
