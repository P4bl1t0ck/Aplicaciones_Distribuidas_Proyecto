# Presentacion_IA.md

Documento de contexto para Canva AI. La presentacion ya existe y no debe cambiarse en estilo, colores, orden visual ni estructura general. Este documento solo indica que contenido agregar o completar en las diapositivas existentes, usando informacion respaldada por el repositorio `Aplicaciones_Distribuidas_Proyecto`.

Repositorio analizado:

- `README.md`
- `package.json`
- `docker-compose.yml`
- `admin-panel/`
- `backend/`
- `backend/gateway/`
- `backend/common/`
- `backend/services/`
- `docs/`
- `docs/16_sprint_1_ejecucion.md`
- `docs/17_sprint_2_ejecucion.md`
- `docs/18_informe_sprint_1_2_diagramas.md`
- `docs/diagrams/`

Alcance real recomendado para la presentacion: explicar el estado estable hasta Sprint 2, mencionando los modulos esperados de sprints posteriores como planificados o parcialmente estructurados, no como cierre final completo.

---

## Agregado 1

Titulo sugerido

Prototipo QuitoQuest

Texto (maximo cuatro viñetas)

- QuitoQuest es una plataforma distribuida para turismo gamificado en Quito.
- Permite registrar usuarios, gestionar perfiles, consultar puntos de interes y validar check-ins por ubicacion.
- Resuelve la dispersion de informacion turistica y busca incentivar recorridos por lugares culturales.
- Se eligio una arquitectura de microservicios para separar responsabilidades y facilitar crecimiento futuro.

Notas del expositor (30 segundos)

QuitoQuest es el prototipo del proyecto. Su objetivo es mejorar la experiencia turistica en Quito mediante gamificacion, geolocalizacion y servicios distribuidos. Hasta el Sprint 2 ya se implemento el flujo base: registro, login, perfil, consulta de POIs y check-in con validacion geografica.

Captura sugerida

Captura del README principal donde se describe QuitoQuest o captura del panel React levantado en navegador.

Archivo del repositorio donde obtener la captura

- `README.md`
- `admin-panel/src/App.jsx`
- `admin-panel/`

Diagrama recomendado

`docs/diagrams/arquitectura-general-sprint-1-2.puml`

Justificacion tecnica

El repositorio define QuitoQuest como una plataforma distribuida para turismo gamificado y contiene backend por microservicios, API Gateway, panel React y documentacion tecnica asociada.

---

## Agregado 2

Titulo sugerido

Arquitectura distribuida implementada

Texto (maximo cuatro viñetas)

- El API Gateway centraliza las peticiones REST y valida JWT en rutas protegidas.
- Los microservicios principales hasta Sprint 2 son `auth-service`, `user-service` y `geo-service`.
- RabbitMQ queda configurado para eventos asincronicos y existe un Broker Mock local con Socket.IO.
- Docker Compose define la infraestructura local: PostgreSQL, MongoDB, Redis, RabbitMQ, Gateway y servicios backend.

Notas del expositor (30 segundos)

La arquitectura usa un gateway como punto unico de entrada. Desde ahi se enrutan las solicitudes a servicios especializados. Para procesos desacoplados se usa un EventBus, que puede trabajar con RabbitMQ o con un broker mock local. Docker Compose permite levantar la infraestructura de forma replicable.

Captura sugerida

Captura de `docker-compose.yml` mostrando servicios y puertos, o captura de `backend/gateway/src/index.js` mostrando las rutas proxy.

Archivo del repositorio donde obtener la captura

- `docker-compose.yml`
- `backend/gateway/src/index.js`
- `backend/common/eventBus.js`

Diagrama recomendado

`docs/diagrams/arquitectura-general-sprint-1-2.puml`

Justificacion tecnica

La arquitectura esta respaldada por `docker-compose.yml`, los workspaces de `package.json`, el gateway Express y el EventBus compartido en `backend/common`.

---

## Agregado 3

Titulo sugerido

Tecnologias utilizadas

Texto (maximo cuatro viñetas)

- Backend: Node.js, Express, JWT, Bcrypt y NPM Workspaces.
- Frontend: React con Vite para el panel administrativo.
- Infraestructura: Docker Compose, PostgreSQL, MongoDB, Redis y RabbitMQ.
- Documentacion: Markdown y diagramas PlantUML en `docs/diagrams/`.

Notas del expositor (30 segundos)

Las tecnologias fueron seleccionadas para construir un entorno distribuido y modular. Node.js y Express permiten servicios ligeros; Docker Compose facilita levantar dependencias; RabbitMQ permite comunicacion asincronica; React y Vite permiten una interfaz web de administracion.

Captura sugerida

Captura de la tabla de dependencias o scripts en `package.json`.

Archivo del repositorio donde obtener la captura

- `package.json`
- `backend/services/*/package.json`
- `admin-panel/package.json`
- `docker-compose.yml`

Diagrama recomendado

`docs/diagrams/estructura-repositorio-sprint-1-2.puml`

Justificacion tecnica

Las tecnologias aparecen en los archivos `package.json`, en los Dockerfiles y en la configuracion de Docker Compose.

---

## Agregado 4

Titulo sugerido

Modulos implementados y modulos esperados

Texto (maximo cuatro viñetas)

- Implementados hasta Sprint 2: Gateway, Auth, User, Geo, EventBus, Broker Mock y panel React base.
- Configurados en Docker: PostgreSQL, MongoDB, Redis y RabbitMQ.
- Esperados para sprints posteriores: eventos culturales, gamificacion, recompensas, recomendaciones, notificaciones y analitica.
- Pendiente tecnico: migrar persistencia local JSON a bases de datos reales y completar integraciones finales.

Notas del expositor (30 segundos)

El corte estable no representa todo el producto final, sino el avance hasta Sprint 2. Ya existe la estructura de microservicios y se completo el flujo base del usuario. Los servicios posteriores estan planificados y algunos tienen estructura en el repositorio, pero no deben presentarse como cierre funcional completo de Sprint 2.

Captura sugerida

Captura de la carpeta `backend/services/` mostrando los microservicios.

Archivo del repositorio donde obtener la captura

- `backend/services/`
- `docs/04_microservicios.md`
- `docs/12_sprints.md`
- `docs/17_sprint_2_ejecucion.md`

Diagrama recomendado

`docs/diagrams/componentes-gateway-sprint-2.puml`

Justificacion tecnica

La estructura de servicios existe en el repositorio, pero la documentacion de cierre real hasta Sprint 2 esta en `docs/16_sprint_1_ejecucion.md` y `docs/17_sprint_2_ejecucion.md`.

---

## Agregado 5

Titulo sugerido

Sprint 1: Infraestructura base

Texto (maximo cuatro viñetas)

- Objetivo: preparar monorepo, Docker Compose, microservicios base y paquete compartido `common`.
- Debia implementarse: repositorio organizado, infraestructura local, gateway y skeletons de servicios.
- Se implemento realmente: Dockerfiles corregidos, API Gateway funcional, healthcheck publico y panel React con script `dev:panel`.
- Resultado: entorno listo para ejecutar servicios backend, infraestructura y panel administrativo.

Notas del expositor (30 segundos)

El Sprint 1 fue la base tecnica del proyecto. Se corrigieron problemas de Docker, rutas de ejecucion y dependencias internas del monorepo. Esto permitio que el equipo pudiera trabajar sobre una estructura comun y ejecutar el gateway, los servicios y el panel web.

Captura sugerida

Captura de `GET http://localhost:8000/health` o captura de Docker Desktop con los contenedores.

Archivo del repositorio donde obtener la captura

- `docs/16_sprint_1_ejecucion.md`
- `docker-compose.yml`
- `backend/gateway/Dockerfile`
- `backend/services/*/Dockerfile`

Diagrama recomendado

`docs/diagrams/despliegue-docker-sprint-1-2.puml`

Justificacion tecnica

El documento `16_sprint_1_ejecucion.md` detalla los cambios realizados: Docker Compose, Dockerfiles, Gateway, RabbitMQ y panel React.

---

## Agregado 6

Titulo sugerido

Sprint 2: Autenticacion, usuarios y geolocalizacion

Texto (maximo cuatro viñetas)

- Objetivo: implementar registro, login, perfil de usuario y geofencing.
- Debia implementarse: `auth-service`, `user-service`, `geo-service` y proteccion JWT desde Gateway.
- Se implemento realmente: JWT, Bcrypt, perfil `/profile/me`, POIs cercanos, Haversine y check-in con evento `POI_VISITED`.
- Resultado: flujo funcional base para autenticar usuario y validar visita a un checkpoint turistico.

Notas del expositor (30 segundos)

El Sprint 2 completo el primer flujo funcional del usuario. El turista puede registrarse, iniciar sesion, recibir un token JWT, consultar su perfil, buscar puntos cercanos y hacer check-in. Si la ubicacion esta dentro de 50 metros, el sistema publica el evento `POI_VISITED`.

Captura sugerida

Captura de Postman con login exitoso o check-in exitoso.

Archivo del repositorio donde obtener la captura

- `docs/17_sprint_2_ejecucion.md`
- `backend/services/auth-service/src/services/authService.js`
- `backend/services/user-service/src/index.js`
- `backend/services/geo-service/src/index.js`
- `backend/gateway/src/index.js`

Diagrama recomendado

`docs/diagrams/registro-login-perfil-sequence.puml` y `docs/diagrams/checkin-sequence-sprint-2.puml`

Justificacion tecnica

Los endpoints y reglas del Sprint 2 estan implementados en los servicios reales y documentados en `docs/17_sprint_2_ejecucion.md`.

---

## Agregado 7

Titulo sugerido

Sprint 3: Modulos planificados de eventos y gamificacion

Texto (maximo cuatro viñetas)

- Objetivo planificado: conectar eventos, gamificacion y mensajeria asincronica.
- Debia implementarse: `events-service`, procesamiento de `POI_VISITED`, XP y leaderboard.
- Implementacion real en el corte: existen carpetas y archivos base, pero el cierre documentado hasta ahora llega a Sprint 2.
- Resultado esperado: usar `POI_VISITED` para actualizar progreso, XP y ranking.

Notas del expositor (30 segundos)

El Sprint 3 aparece en la planificacion como la etapa donde el evento de check-in comienza a alimentar gamificacion y eventos culturales. Para no exagerar el avance, se recomienda presentarlo como modulo esperado o siguiente etapa, porque el documento de cierre estable llega hasta Sprint 2.

Captura sugerida

Captura de `docs/12_sprints.md` en la seccion Sprint 3 o captura de carpetas `events-service` y `gamification-service`.

Archivo del repositorio donde obtener la captura

- `docs/12_sprints.md`
- `backend/services/events-service/`
- `backend/services/gamification-service/`

Diagrama recomendado

`docs/diagrams/flujo-eventbus-sprint-2.puml`

Justificacion tecnica

`docs/12_sprints.md` define Sprint 3 como etapa de gamificacion, scraping de eventos y mensajeria. El evento `POI_VISITED` ya se publica desde Sprint 2.

---

## Agregado 8

Titulo sugerido

Sprint 4: Recompensas, recomendaciones y frontends

Texto (maximo cuatro viñetas)

- Objetivo planificado: construir marketplace de recompensas y recomendaciones personalizadas.
- Debia implementarse: `reward-service`, `recommendation-service`, dashboard React y aplicacion movil.
- Implementacion real en el corte: panel React existe como proyecto Vite y los servicios estan estructurados en el backend.
- Resultado esperado: integrar canje de cupones, recomendaciones y vistas finales de usuario.

Notas del expositor (30 segundos)

Sprint 4 corresponde a la etapa de experiencia completa: recompensas, recomendaciones y frontends. En el repositorio ya existen carpetas y configuraciones, pero para la presentacion debe quedar claro que el avance estable documentado se concentra en Sprint 1 y Sprint 2.

Captura sugerida

Captura de `admin-panel/` o de `docs/12_sprints.md` en Sprint 4.

Archivo del repositorio donde obtener la captura

- `docs/12_sprints.md`
- `admin-panel/`
- `backend/services/reward-service/`
- `backend/services/recommendation-service/`

Diagrama recomendado

No obligatorio para el corte Sprint 2. Si se requiere, usar solo diagrama de estructura del repositorio.

Justificacion tecnica

La planificacion de Sprint 4 existe en `docs/12_sprints.md`; el panel React existe en `admin-panel`, pero la integracion final pertenece a una etapa posterior.

---

## Agregado 9

Titulo sugerido

Sprint 5: Pruebas, validacion y cierre

Texto (maximo cuatro viñetas)

- Objetivo planificado: pruebas de carga, documentacion final y empaquetamiento de presentacion.
- Debia implementarse: validaciones con Artillery o herramientas similares y manual final.
- Implementacion real en el corte: se documentaron validaciones manuales de endpoints y configuracion Docker.
- Resultado esperado: cerrar pruebas integrales y preparar demostracion academica.

Notas del expositor (30 segundos)

Sprint 5 se plantea como fase de cierre y aseguramiento de calidad. Hasta el corte revisado, las pruebas documentadas son principalmente de entorno, healthcheck, endpoints principales y flujo Sprint 2. Las pruebas de carga quedan como actividad de cierre.

Captura sugerida

Captura de `docs/16_sprint_1_ejecucion.md` y `docs/17_sprint_2_ejecucion.md` en la seccion de validaciones.

Archivo del repositorio donde obtener la captura

- `docs/12_sprints.md`
- `docs/16_sprint_1_ejecucion.md`
- `docs/17_sprint_2_ejecucion.md`

Diagrama recomendado

No obligatorio. Usar capturas de pruebas en Postman o terminal.

Justificacion tecnica

El cierre de pruebas esta planificado en `docs/12_sprints.md`; los resultados comprobados hasta Sprint 2 estan documentados en los documentos 16 y 17.

---

## Agregado 10

Titulo sugerido

Resultados obtenidos

Texto (maximo cinco viñetas)

- Monorepo funcional con workspaces para backend, gateway, microservicios y panel React.
- API Gateway operativo con rutas publicas y rutas protegidas mediante JWT.
- Registro, login, perfil de usuario, POIs cercanos y check-in geolocalizado implementados.
- EventBus preparado para RabbitMQ y broker mock local.
- Pendiente: persistencia definitiva en bases de datos, integracion completa de gamificacion, recompensas, recomendaciones y frontend final.

Notas del expositor (30 segundos)

El resultado principal es que el proyecto ya tiene una base distribuida funcional y demostrable. La parte mas importante completada es el flujo del usuario hasta check-in. Quedan pendientes las integraciones posteriores, especialmente gamificacion, recompensas, recomendaciones y persistencia final en bases reales.

Captura sugerida

Captura de Postman con `GET /health`, login y check-in exitoso.

Archivo del repositorio donde obtener la captura

- `docs/17_sprint_2_ejecucion.md`
- `backend/gateway/src/index.js`
- `backend/services/geo-service/src/index.js`

Diagrama recomendado

`docs/diagrams/comunicacion-distribuida-sprint-1-2.puml`

Justificacion tecnica

Los resultados estan respaldados por los documentos de ejecucion de Sprint 1 y Sprint 2, ademas del codigo implementado en Gateway, Auth, User y Geo.

---

## Agregado 11

Titulo sugerido

Decisiones tecnicas relevantes

Texto (maximo cuatro viñetas)

- Se uso un API Gateway para centralizar autenticacion y enrutamiento.
- Se aplico EventBus para desacoplar servicios mediante eventos.
- Se mantuvo persistencia JSON local en Sprint 2 para facilitar pruebas sin bloquear el avance.
- Se preparo Docker Compose para replicar infraestructura y servicios en local.

Notas del expositor (30 segundos)

Las decisiones tecnicas buscan equilibrar avance funcional y arquitectura distribuida. El Gateway evita exponer cada servicio directamente. El EventBus prepara el sistema para flujos asincronicos. La persistencia local permite probar rapido, mientras Docker deja lista la infraestructura real.

Captura sugerida

Captura de `backend/common/eventBus.js` y `backend/gateway/src/index.js`.

Archivo del repositorio donde obtener la captura

- `backend/gateway/src/index.js`
- `backend/common/eventBus.js`
- `backend/services/auth-service/src/repositories/userRepository.js`
- `backend/services/user-service/src/repositories/userProfileRepository.js`

Diagrama recomendado

`docs/diagrams/componentes-gateway-sprint-2.puml`

Justificacion tecnica

Estas decisiones aparecen reflejadas directamente en el codigo del Gateway, EventBus y repositorios usados por Sprint 2.

---

## Agregado 12

Titulo sugerido

Conclusiones

Texto (maximo cuatro viñetas)

- QuitoQuest demuestra una base real de arquitectura distribuida con microservicios y Gateway.
- El Sprint 2 deja funcionando el flujo minimo de usuario: autenticacion, perfil y check-in.
- La separacion por servicios facilita mantenimiento, escalabilidad y trabajo colaborativo.
- El siguiente paso es completar persistencia, gamificacion, recompensas, recomendaciones e integracion de frontends.

Notas del expositor (30 segundos)

Como conclusion, el proyecto ya cuenta con una base tecnica solida. Aunque todavia faltan modulos finales, el avance demuestra los principios del curso: separacion de responsabilidades, comunicacion entre servicios, uso de contenedores y preparacion para eventos asincronicos.

Captura sugerida

Captura combinada de estructura del proyecto y endpoints probados.

Archivo del repositorio donde obtener la captura

- `docs/18_informe_sprint_1_2_diagramas.md`
- `docs/diagrams/`
- `docs/17_sprint_2_ejecucion.md`

Diagrama recomendado

`docs/diagrams/arquitectura-general-sprint-1-2.puml`

Justificacion tecnica

Las conclusiones se basan en el estado documentado hasta Sprint 2 y en la estructura real del repositorio.

---

## Tabla final para Canva AI

| Seccion | Agregar nueva diapositiva | Modificar diapositiva existente | Captura recomendada |
| --- | --- | --- | --- |
| Prototipo QuitoQuest | No necesariamente | Si existe una diapositiva de introduccion/prototipo, completarla | README o panel React |
| Arquitectura distribuida | No, si ya existe arquitectura | Completar con Gateway, microservicios, EventBus y Docker | `docker-compose.yml` o diagrama arquitectura |
| Tecnologias utilizadas | No, si ya existe tabla tecnica | Completar tabla con Node, Express, React, Docker, RabbitMQ, JWT | `package.json` y `docker-compose.yml` |
| Modulos implementados y esperados | Si falta comparacion de alcance | Agregar como diapositiva de estado del proyecto | Carpeta `backend/services/` |
| Sprint 1 | No, si ya existe timeline | Completar con infraestructura base y Docker | `docs/16_sprint_1_ejecucion.md` |
| Sprint 2 | No, si ya existe timeline | Completar con auth, user, geo y check-in | Postman login/check-in o `docs/17_sprint_2_ejecucion.md` |
| Sprint 3 | No | Marcar como planificado/siguiente etapa | `docs/12_sprints.md` |
| Sprint 4 | No | Marcar como planificado/siguiente etapa | `docs/12_sprints.md` y `admin-panel/` |
| Sprint 5 | No | Marcar como cierre y pruebas planificadas | Validaciones docs 16 y 17 |
| Resultados obtenidos | Si falta cierre tecnico | Agregar una diapositiva de resultados | Healthcheck, login, POIs, check-in |
| Decisiones tecnicas | Opcional | Puede integrarse en arquitectura | Gateway y EventBus en codigo |
| Conclusiones | Si falta cierre | Completar diapositiva final | Diagrama general o resumen de endpoints |

---

## GUION DE EXPOSICION

### Agregado 1: Prototipo QuitoQuest

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

QuitoQuest es una plataforma distribuida para mejorar la experiencia turistica en Quito. El prototipo permite registrar usuarios, manejar perfiles, consultar puntos de interes y validar visitas mediante check-in geolocalizado. La solucion se eligio porque combina turismo, gamificacion y arquitectura de microservicios.

### Agregado 2: Arquitectura distribuida implementada

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

La arquitectura se organiza alrededor de un API Gateway que recibe todas las solicitudes. Los servicios principales son Auth, User y Geo. Para comunicacion asincronica se usa un EventBus compatible con RabbitMQ y con un broker mock local. Docker Compose prepara toda la infraestructura.

### Agregado 3: Tecnologias utilizadas

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

El backend esta construido con Node.js y Express. La autenticacion usa JWT y Bcrypt. El panel administrativo utiliza React con Vite. Para infraestructura se configuro Docker Compose con PostgreSQL, MongoDB, Redis y RabbitMQ, aunque hasta Sprint 2 la persistencia funcional es local.

### Agregado 4: Modulos implementados y esperados

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

Hasta Sprint 2 quedaron implementados Gateway, Auth, User, Geo, EventBus, Broker Mock y panel React base. Los modulos de eventos, gamificacion, recompensas, recomendaciones, notificaciones y analitica estan planificados o estructurados para continuar en los siguientes sprints.

### Agregado 5: Sprint 1

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

El Sprint 1 se concentro en preparar la base tecnica: monorepo, Docker Compose, Dockerfiles, paquete comun y API Gateway. Tambien se corrigieron problemas de construccion y rutas internas, dejando el entorno listo para que el equipo pudiera desarrollar sobre una misma base.

### Agregado 6: Sprint 2

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

El Sprint 2 implemento el flujo principal del usuario: registro, login, JWT, perfil, consulta de POIs cercanos y check-in. El Geo Service calcula distancia con Haversine y publica `POI_VISITED` cuando el usuario esta dentro del radio permitido.

### Agregado 7: Sprint 3

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

Sprint 3 esta planificado para conectar eventos culturales y gamificacion. La idea es que el evento `POI_VISITED`, ya emitido por Geo Service, sea consumido por Gamification para sumar XP, completar misiones y alimentar el leaderboard.

### Agregado 8: Sprint 4

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

Sprint 4 corresponde a recompensas, recomendaciones y frontends. El repositorio ya contiene estructura para esos servicios y un panel React base, pero deben presentarse como siguiente fase de integracion, no como cierre estable de Sprint 2.

### Agregado 9: Sprint 5

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

Sprint 5 se orienta a pruebas, validacion y cierre. Hasta este punto se tienen validaciones manuales de endpoints y configuracion, pero quedan pendientes pruebas de carga, integracion final y empaquetamiento completo para demostracion.

### Agregado 10: Resultados obtenidos

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

El resultado alcanzado es una base distribuida funcional. Ya se puede levantar el gateway, registrar usuarios, iniciar sesion, consultar perfil, obtener POIs cercanos y validar check-ins. Queda pendiente completar persistencia final e integrar los modulos avanzados.

### Agregado 11: Decisiones tecnicas relevantes

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

Las decisiones principales fueron centralizar acceso en el Gateway, separar responsabilidades por microservicio, usar eventos para desacoplar procesos y mantener Docker Compose como base de ejecucion local. Esto facilita mantenimiento y crecimiento del sistema.

### Agregado 12: Conclusiones

Tiempo estimado:

30 segundos

Texto que deberia decir el expositor:

QuitoQuest demuestra la aplicacion practica de sistemas distribuidos mediante microservicios, gateway, contenedores y eventos. El avance hasta Sprint 2 deja una base funcional clara y preparada para continuar con gamificacion, recompensas, recomendaciones e integracion final.
