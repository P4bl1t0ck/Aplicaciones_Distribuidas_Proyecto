# 13 - Estándar de Naming, Código y Convenciones Git

Para facilitar el desarrollo concurrente del equipo y asegurar la legibilidad del código, se establecen las siguientes directrices y convenciones técnicas de carácter obligatorio.

---

## 1. Nomenclatura en Código y Archivos

* **Carpetas y Archivos del Backend/Frontend**: kebab-case. Ej: `auth-service`, `event-bus.js`, `admin-panel`.
* **Variables y Funciones en Javascript/Typescript**: camelCase. Ej: `const checkInLocation = async (lat, lng) => { ... }`.
* **Clases y Componentes React**: PascalCase. Ej: `class RecommendationEngine { ... }`, `const MapDashboard = () => { ... }`.
* **Constantes y Variables de Entorno**: UPPER_SNAKE_CASE. Ej: `const JWT_SECRET = process.env.JWT_SECRET;`.

---

## 2. Convenciones de Base de Datos (PostgreSQL & MongoDB)

### PostgreSQL (Bases Relacionales)
* **Tablas**: snake_case y en plural. Ej: `users`, `user_missions`, `xp_histories`.
* **Columnas**: snake_case en singular. Ej: `user_id`, `password_hash`, `created_at`.
* **Claves Primarias (PK)**: `id` (preferiblemente de tipo UUID).
* **Claves Foráneas (FK)**: `nombreTablaSingular_id`. Ej: `user_id` apuntando a `users(id)`.

### MongoDB (Documental)
* **Colecciones**: snake_case en plural. Ej: `events`, `visit_logs`.
* **Campos del Documento**: camelCase. Ej: `startDate`, `isFree`.

---

## 3. Estándar de Ramas en Git (Git Flow simplificado)

El repositorio principal cuenta con dos ramas protegidas:
* `main`: Código estable y listo para producción. Únicamente se actualiza mediante Pull Requests desde `develop`.
* `develop`: Rama base de integración diaria de características.

### Creación de Ramas de Trabajo:
* **Nuevas Características**: `feature/nombre-de-la-tarea`. Ej: `feature/auth-jwt-implementation`.
* **Corrección de Errores**: `bugfix/descripcion-del-error`. Ej: `bugfix/geo-haversine-radius-correction`.
* **Documentación**: `docs/seccion-modificada`. Ej: `docs/api-contracts-update`.
* **Refactorizaciones**: `refactor/nombre-modulo`. Ej: `refactor/event-bus-rabbitmq-migration`.

---

## 4. Mensajes de Commit Semánticos (Conventional Commits)

Cada commit debe describir con claridad y brevedad los cambios realizados, utilizando prefijos estandarizados:
* `feat`: Una nueva funcionalidad. Ej: `feat(geo): add check-in geofence verification algorithm`
* `fix`: Corrección de un bug. Ej: `fix(auth): fix token validation expiration bug`
* `docs`: Cambios en la documentación. Ej: `docs(readme): update environment setup instructions`
* `style`: Cambios en el formato estético del código (espaciados, punto y coma, sin cambiar lógica). Ej: `style(react): format landing page grid layout`
* `refactor`: Cambios en el código que no añaden características ni corrigen errores. Ej: `refactor(common): extract event bus memory adapter`
* `test`: Adición o modificación de pruebas unitarias/integración. Ej: `test(auth): add unit test for register password hashing`
