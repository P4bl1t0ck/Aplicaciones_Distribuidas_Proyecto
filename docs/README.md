# QuitoQuest - Documentación Técnica Principal

## Plataforma Inteligente Distribuida para Turismo Gamificado en Quito

Bienvenido a la documentación oficial de **QuitoQuest**, una plataforma distribuida orientada a transformar la experiencia turística de la ciudad de Quito mediante técnicas de gamificación, geolocalización inteligente y recomendaciones personalizadas en tiempo real.

Este repositorio de documentación sirve como la única fuente de verdad técnica para el desarrollo del sistema, la configuración de infraestructura, y el diseño de la base de datos de microservicios.

---

## Estructura de Documentos Técnicos

La documentación está dividida en las siguientes secciones temáticas. Haz clic en cada una para acceder a la especificación detallada:

1. [Visión General](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/01_vision_general.md): Problema, justificación, alcance, objetivos generales y específicos, MVP y roadmap general.
2. [Caso de Estudio](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/02_caso_de_estudio.md): Entorno del Municipio de Quito, actores involucrados (turistas, comercios, municipio), variables y restricciones físicas/tecnológicas.
3. [Arquitectura General](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/03_arquitectura.md): Patrones de sistemas distribuidos, flujo de peticiones, diseño modular y diagramas conceptuales.
4. [Diseño de Microservicios](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/04_microservicios.md): Responsabilidades, tecnologías, bases de datos y escalado para cada uno de los 9 microservicios principales.
5. [Modelo de Datos](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/05_modelo_datos.md): Esquemas lógicos y relaciones de bases de datos para PostgreSQL, MongoDB y Redis.
6. [Contratos de API (REST)](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/06_api.md): Endpoints HTTP, estructuras JSON de peticiones y respuestas para todos los servicios a través del Gateway.
7. [Desarrollo Frontend](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/07_frontend.md): Arquitectura de la aplicación móvil (Flutter/Riverpod) y el panel web administrativo (React.js).
8. [Estructura del Backend](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/08_backend.md): Estructura del código monorepo, frameworks utilizados (Node.js/Express) y patrones aplicados (Repository, Controller).
9. [DevOps y Despliegue](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/09_devops.md): Configuración de Docker, orquestación en Kubernetes, balanceo de carga (Nginx Ingress) y pipelines de CI/CD.
10. [Seguridad Distribuida](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/10_seguridad.md): Autenticación basada en JWT, Refresh Tokens, control de accesos RBAC, y mecanismos de mitigación contra spoofing GPS y ataques de denegación.
11. [Plan de Implementación MVP](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/11_implementacion.md): Hitos del proyecto, fases y entregables del producto mínimo viable.
12. [Planificación de Sprints](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/12_sprints.md): Cronograma detallado de 8 semanas de desarrollo por integrante.
13. [Estándar de Naming y Git](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/13_naming.md): Convenciones de nomenclatura para código, bases de datos, ramas de Git y commits.
14. [Coordinación y Consistencia](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/14_coordinacion.md): Gestión de consistencia eventual, transacciones distribuidas (Saga/Outbox), locks distribuidos y manejo de concurrencia.
15. [Monitoreo y Observabilidad](file:///C:/Users/Pablo/Desktop/APP_p3_AD/docs/15_observabilidad.md): Configuración de logs centralizados (Loki), métricas (Prometheus/Grafana) y trazabilidad distribuida (Jaeger).

---

## Flujo del Ciclo de Vida del MVP

El sistema está diseñado bajo un modelo guiado por eventos (Event-Driven Architecture). Al ejecutar el demo, se valida el siguiente ciclo:

```
[ Registro / Login ] -> [ Configurar Preferencias ] -> [ Cargar Mapa & Recomendaciones ]
                                                                     │
                                                                     ▼
[ Obtención de Cupón ] <- [ Gamificación actualiza XP ] <- [ Geolocalización verifica Check-in ]
         │
         ▼
[ Notificación Live (Websocket) ] -> [ Registro en Analytics / Data Warehouse ]
```
