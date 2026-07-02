# QuitoQuest 🗺️

> **Plataforma Inteligente Distribuida para Turismo Gamificado en Quito, Ecuador**

---

## 👥 Integrantes

| Nombre | Rol |
|--------|-----|
| Montalvo Pablo | Arquitectura & Backend Lead |
| Saa Patricio | Microservicios & Infraestructura |
| Moreta Carlos | Frontend & UX |
| Cevallos Josué | Base de Datos & APIs |
| Cahueñas Alexander | DevOps & Testing |

**Materia:** Aplicaciones y Sistemas Distribuidos  
**Docente:** Hugo Fernando Chimbo Acosta  
**Fecha:** 26 de Abril del 2026

---

## 🎯 ¿Qué es QuitoQuest?

QuitoQuest es una **plataforma distribuida orientada a transformar la experiencia turística y cultural de Quito** mediante gamificación, geolocalización en tiempo real y un sistema de recompensas conectado con comercios locales.

El sistema implementa una **arquitectura de microservicios** con 9 servicios independientes, comunicación asíncrona mediante RabbitMQ, un API Gateway central y un panel de administración en React.

---

## 🏗️ Arquitectura General

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CLIENTES                                          │
│         App Móvil (React Native)    Panel Admin (React + Vite)               │
└─────────────────────────┬────────────────────────────┬──────────────────────┘
                          │ HTTPS                       │ HTTPS
                          ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY  :8000                                     │
│           Autenticación JWT · Rate Limiting · Logging · Proxy               │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │ REST / HTTP interno
          ┌────────────────────────┼─────────────────────────┐
          │                        │                          │
          ▼                        ▼                          ▼
   ┌─────────────┐        ┌──────────────┐           ┌──────────────┐
   │ Auth :3001  │        │  Geo :3003   │           │Events :3004  │
   │ JWT / Auth  │        │  GeoFencing  │           │ MongoDB CRUD │
   └──────┬──────┘        └──────┬───────┘           └──────┬───────┘
          │                      │                           │
          ▼                      ▼                           ▼
   ┌─────────────┐    ┌────────────────────┐     ┌──────────────────┐
   │PostgreSQL   │    │     Redis          │     │ RabbitMQ Broker  │
   │ AuthDB      │    │  GeoCache+Leaderbd │     │ async events     │
   └─────────────┘    └────────────────────┘     └────────┬─────────┘
                                                          │
              ┌───────────────────────────────────────────┤
              │                    │                       │
              ▼                    ▼                       ▼
   ┌────────────────┐   ┌───────────────────┐   ┌──────────────────┐
   │Gamification    │   │  Reward :3006     │   │Notification:3007 │
   │    :3005       │   │  QuestCoins/Cpns  │   │ Push/Email/SMS   │
   └────────────────┘   └───────────────────┘   └──────────────────┘
              │
   ┌──────────┴──────────┐
   │                     │
   ▼                     ▼
┌──────────────┐  ┌─────────────────┐
│Recommendation│  │Analytics :3009  │
│   :3008      │  │ KPIs/Reports    │
└──────────────┘  └─────────────────┘
```

---

## 📦 Estructura del Proyecto

```
APP_p3_AD/
├── 📁 backend/
│   ├── 📁 gateway/                  # API Gateway (puerto 8000)
│   │   ├── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── 📁 shared/                   # Módulos compartidos
│   │   ├── eventBus.js              # Cliente RabbitMQ
│   │   └── logger.js
│   └── 📁 services/
│       ├── 📁 auth-service/         # Autenticación JWT (3001)
│       ├── 📁 user-service/         # Gestión de usuarios (3002)
│       ├── 📁 geo-service/          # Geolocalización + GeoFencing (3003)
│       ├── 📁 events-service/       # Eventos y lugares (3004)
│       ├── 📁 gamification-service/ # Misiones y XP (3005)
│       ├── 📁 reward-service/       # Recompensas y cupones (3006)
│       ├── 📁 notification-service/ # Push/Email (3007)
│       ├── 📁 recommendation-service/ # Motor IA (3008)
│       └── 📁 analytics-service/   # KPIs y reportes (3009)
├── 📁 admin-panel/                  # Dashboard React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── 📁 docs/                         # Documentación técnica
│   ├── README.md
│   ├── 01_vision_general.md
│   ├── 02_caso_de_estudio.md
│   ├── 03_arquitectura.md
│   ├── 04_modelo_de_datos.md
│   ├── 05_api_endpoints.md
│   ├── 06_gamificacion.md
│   ├── 07_seguridad.md
│   ├── 08_modelo_de_negocio.md
│   ├── 09_infraestructura_devops.md
│   ├── 10_mobile_frontend.md
│   ├── 11_sistema_recomendaciones.md
│   ├── 12_testing_calidad.md
│   ├── 13_analisis_riesgos.md
│   ├── 14_roadmap.md
│   └── 15_glosario.md
├── docker-compose.yml
├── package.json
└── .gitignore
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18
- npm >= 9
- (Opcional) Docker Desktop para infraestructura

### 1. Instalar dependencias

```bash
# Desde la raíz del proyecto
npm run install:all
```

### 2. Modo Desarrollo (sin Docker)

Los servicios usarán SQLite / LowDB / almacenamiento en memoria como fallback automático.

```bash
# Terminal 1 – Levantar el Gateway y todos los servicios
npm run dev

# Terminal 2 – Levantar el Admin Panel
npm run dev:panel
```

El **API Gateway** escuchará en: [http://localhost:8000](http://localhost:8000)  
El **Admin Panel** estará disponible en: [http://localhost:5173](http://localhost:5173)

### 3. Modo Docker (Producción)

```bash
docker-compose up --build
```

| Servicio | URL |
|---------|-----|
| API Gateway | http://localhost:8000 |
| Admin Panel (npm run dev) | http://localhost:5173 |
| RabbitMQ Management | http://localhost:15672 |
| PostgreSQL | localhost:5432 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

---

## 🔌 API Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/events` | Lista de eventos/lugares |
| GET | `/api/events/:id` | Detalle de lugar |
| POST | `/api/geo/checkin` | Check-in geolocalizado |
| GET | `/api/gamification/leaderboard` | Tabla de líderes |
| GET | `/api/rewards/my-rewards` | Recompensas del usuario |
| POST | `/api/rewards/redeem/:id` | Canjear recompensa |
| GET | `/api/recommendation` | Recomendaciones personalizadas |

Ver documentación completa en [docs/05_api_endpoints.md](./docs/05_api_endpoints.md)

---

## 📚 Documentación

La carpeta [`docs/`](./docs/) contiene 15 documentos técnicos que cubren cada aspecto del sistema:

| # | Documento | Contenido |
|---|-----------|-----------|
| 01 | [Visión General](./docs/01_vision_general.md) | Objetivos, alcance, roadmap |
| 02 | [Caso de Estudio](./docs/02_caso_de_estudio.md) | Contexto de Quito, usuarios |
| 03 | [Arquitectura](./docs/03_arquitectura.md) | Diagramas, patrones, decisiones |
| 04 | [Modelo de Datos](./docs/04_modelo_de_datos.md) | ERD, esquemas MongoDB |
| 05 | [API Endpoints](./docs/05_api_endpoints.md) | Referencia completa de la API |
| 06 | [Gamificación](./docs/06_gamificacion.md) | Misiones, XP, badges |
| 07 | [Seguridad](./docs/07_seguridad.md) | JWT, HTTPS, OWASP |
| 08 | [Modelo de Negocio](./docs/08_modelo_de_negocio.md) | Canvas, monetización |
| 09 | [Infraestructura](./docs/09_infraestructura_devops.md) | Docker, K8s, CI/CD |
| 10 | [Mobile & Frontend](./docs/10_mobile_frontend.md) | React Native, Admin Panel |
| 11 | [Recomendaciones IA](./docs/11_sistema_recomendaciones.md) | Motor CF/CBF |
| 12 | [Testing](./docs/12_testing_calidad.md) | Unit, Integration, E2E |
| 13 | [Riesgos](./docs/13_analisis_riesgos.md) | Matriz de riesgos |
| 14 | [Roadmap](./docs/14_roadmap.md) | Fases y hitos |
| 15 | [Glosario](./docs/15_glosario.md) | Términos técnicos |

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js + Express |
| Frontend | React 18 + Vite + Tailwind CSS |
| Base de datos relacional | PostgreSQL 15 |
| Base de datos documental | MongoDB 6 |
| Cache & Rankings | Redis 7 |
| Mensajería asíncrona | RabbitMQ 3 |
| Contenedores | Docker + Docker Compose |
| Autenticación | JWT (JSON Web Tokens) |
| API | REST sobre HTTP/HTTPS |

---

## 👨‍💻 Contribuir

1. Clona el repositorio: `git clone https://github.com/P4bl1t0ck/Aplicaciones_Distribuidas_Proyecto.git`
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Haz tus cambios y commits: `git commit -m "feat: descripción del cambio"`
4. Sube la rama: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de uso académico. Materia: **Aplicaciones y Sistemas Distribuidos**.  
Universidad: ESPE – Sangolquí, Ecuador.

---

*Construido con ❤️ para Quito*
