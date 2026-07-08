# 15 - Observabilidad, Logs y Monitoreo Distribuido

Monitorear el estado de salud, la latencia y los errores en un sistema distribuido con múltiples bases de datos y microservicios es crucial para asegurar la disponibilidad del sistema. **QuitoQuest** implementa un pipeline de observabilidad estructurado en tres pilares: Métricas, Logs y Trazas.

---

## 1. Centralización de Logs (Grafana Loki & Winston)

En lugar de consultar archivos de logs independientes dentro de cada contenedor de microservicio (lo cual es inviable en entornos con decenas de réplicas), se implementa un recolector centralizado.
* **Tecnología**: **Grafana Loki** y **Prometail**.
* **Integración en Microservicios**: Los servicios de Node.js utilizan el logger `winston` configurado para imprimir en formato JSON estructurado a la consola estándar (`stdout`):
```json
{
  "timestamp": "2026-07-02T01:30:15.901Z",
  "level": "info",
  "service": "geo-service",
  "traceId": "a28cb0f190e21a",
  "message": "Geofence check-in successful for user c35be8fd at POI san_francisco. Distance: 12 meters."
}
```
* **Loki & Promtail**: Promtail extrae de manera automática los logs de la salida estándar de los contenedores Docker/Kubernetes y los retransmite a Loki indexados por etiquetas (`service`, `env`). Esto permite realizar búsquedas y filtrados mediante lenguaje LogQL desde el panel de Grafana.

---

## 2. Monitoreo y Métricas (Prometheus & Grafana)

Para medir el rendimiento de los recursos de hardware (CPU, memoria) y las métricas de negocio (check-ins exitosos, cupones creados, latencia de base de datos).
* **Tecnología**: **Prometheus** (recolector) y **Grafana** (visualización).
* **Flujo**:
  - Cada microservicio expone un endpoint `/metrics` en el puerto administrativo, utilizando la librería `prom-client` en Node.js.
  - Prometheus realiza un raspado periódico (*scraping*) de dicho endpoint de cada servicio en intervalos de 15 segundos.
  - Grafana se conecta a Prometheus como origen de datos para renderizar paneles visuales en tiempo real de:
    - Cantidad de usuarios concurrentes activos.
    - Tasas de acierto en el geofencing (check-ins válidos vs sospechosos).
    - Códigos de estado HTTP (porcentaje de 2xx, 4xx, 5xx).
    - Latencia media de respuesta del API Gateway.

---

## 3. Trazabilidad Distribuida (Jaeger & OpenTelemetry)

Cuando el cliente móvil realiza una solicitud de check-in que pasa por el Gateway, se comunica con el servicio de geolocalización, escribe en base de datos y luego interactúa con gamificación, es necesario seguir el hilo exacto de esa petición a través de la red.

* **Tecnología**: **OpenTelemetry SDK** y **Jaeger**.
* **Funcionamiento**:
  - El API Gateway intercepta la llamada, genera un `traceId` único y lo inyecta en la cabecera HTTP (`traceparent`).
  - Cada microservicio propaga este `traceId` en sus llamadas síncronas o en los headers de los mensajes de RabbitMQ.
  - OpenTelemetry reporta las métricas de tiempo de ejecución de cada paso (*span*) a un recolector Jaeger centralizado.
  - **Resultado**: En la UI de Jaeger, los desarrolladores pueden visualizar una línea temporal detallada de la petición, identificando cuellos de botella de red o queries lentas a la base de datos PostgreSQL/MongoDB.
