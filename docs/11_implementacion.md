# 11 - Plan de Implementación del MVP

Este documento define la ruta crítica de desarrollo para construir la versión funcional inicial (Producto Mínimo Viable) de **QuitoQuest**, enfocada en evidenciar los principios de los sistemas distribuidos.

---

## 1. Fases del Proyecto

El desarrollo se divide en 4 bloques cronológicos:

```
                  ┌──────────────────────────────────────────────┐
                  │ Semana 1-2: Configuración e Infraestructura  │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │ Semana 3-5: Core Backend y Base de Datos     │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │ Semana 6-7: Integración Eventos y Frontend   │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │ Semana 8: Pruebas, Validación y Despliegue   │
                  └──────────────────────────────────────────────┘
```

---

## 2. Estrategia de Pruebas y Validación

La verificación del sistema distribuido se realiza en tres niveles para asegurar consistencia e integración correcta:

### A. Pruebas Unitarias y de APIs (REST Tests)
* Cada microservicio cuenta con pruebas independientes utilizando `Jest` o `Supertest` para simular llamadas HTTP.
* Se incluye una colección de Postman/Thunder Client en la carpeta `docs/api/` para probar de forma directa todos los endpoints expuestos a través del Gateway.

### B. Pruebas de Integración y Eventos (Broker Tests)
* Scripts específicos en la carpeta `scripts/` levantan escuchas de eventos.
* Se simula el flujo asíncrono publicando un mensaje ficticio `POI_VISITED` en la cola de RabbitMQ y validando que el `gamification-service` registre el progreso y que el `notification-service` dispare el Toast WebSocket esperado en el cliente.

### C. Pruebas de Carga y Concurrencia
* Utilización de herramientas ligeras como `Artillery` o `k6` para bombardear el endpoint de geofencing `/api/v1/geo/check-in` con 500 peticiones concurrentes por segundo, verificando que Redis GEO no genere latencias superiores a 200ms.

---

## 3. Guía de Ejecución de la Demostración (Demo Flow)

Para evaluar el correcto funcionamiento del MVP durante la exposición, el evaluador puede realizar el siguiente recorrido funcional paso a paso:

1. **Paso 1 - Registro**: Crear un nuevo usuario en la app e iniciar sesión. Validar que la base de datos PostgreSQL (`UsersDB`) almacene las credenciales con hash Bcrypt.
2. **Paso 2 - Preferencias**: Seleccionar intereses en el perfil del usuario.
3. **Paso 3 - Mapa e Eventos**: Cargar el mapa interactivo y verificar que renderice los checkpoints (POIs) e información de eventos culturales consumidos desde el Events Service (MongoDB).
4. **Paso 4 - Simular Check-in**:
   - Enviar coordenadas GPS exactas correspondientes a la Plaza de San Francisco.
   - El Geo Service verifica la distancia, confirma que está en rango (<50 metros) y emite un evento asíncrono.
5. **Paso 5 - Recompensas y Progreso**:
   - El servicio de gamificación recibe el evento, suma 150 XP al perfil del usuario, desbloquea la insignia "Explorador de Iglesias" y dispara una alerta en tiempo real en la pantalla.
   - Si los puntos del usuario superan el umbral de una recompensa del catálogo, el servicio de recompensas genera de forma automática un cupón activo con un código único (ej: `QQ-SANFRAN-123`).
6. **Paso 6 - Validación en el Comercio**:
   - Acceder al panel administrativo en React con rol `PARTNER`.
   - Introducir el código único del cupón para validarlo y simular su consumo. El sistema marca el cupón como "REDEEMED" y actualiza los gráficos de analítica de visitas.
