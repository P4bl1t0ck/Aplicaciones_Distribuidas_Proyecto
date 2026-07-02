# 14 - Coordinación, Transacciones y Consistencia Distribuida

En un sistema de microservicios con bases de datos descentralizadas, garantizar la consistencia de los datos y evitar condiciones de carrera (*race conditions*) es uno de los desafíos de ingeniería más complejos. **QuitoQuest** implementa patrones de coordinación específicos para solventar esto.

---

## 1. Consistencia Eventual (ACID vs BASE)

El sistema opera bajo el principio de **consistencia eventual** (modelo BASE - *Basically Available, Soft state, Eventual consistency*).
* **Transacciones Locales**: Cada microservicio garantiza consistencia ACID estricta de manera local (p. ej., el servicio de recompensas confirma en su Postgres la deducción de saldo/XP e inserción del cupón en una transacción local atómica).
* **Propagación Distribuida**: Los cambios hacia otros microservicios (como el historial en `analytics-service` o el ranking en `gamification-service`) se propagan mediante eventos asíncronos en RabbitMQ. Los servicios destino se actualizan unos milisegundos después de que finaliza la transacción de origen.

---

## 2. Patrón Outbox para Publicación Confiable

Para evitar inconsistencias causadas por fallos de red intermedias (ej. la base de datos registra el check-in pero el broker RabbitMQ se cae antes de poder enviarle el evento `POI_VISITED`), se implementa el **Transactional Outbox Pattern**:

```
┌────────────────────────────────────────────────────────┐
│               Gamification Microservice                │
│                                                        │
│  [ Transacción SQL Atómica ]                           │
│  ├── 1. Actualiza user_progress (XP + 150)             │
│  └── 2. Inserta evento en tabla "outbox"               │
│                                                        │
└───────────┬────────────────────────────────────────────┘
            │
            ▼ (Outbox Poller / Debezium)
┌───────────┴────────────────────────────────────────────┐
│                    Event Publisher                     │
│                                                        │
│  ├── 3. Lee tabla "outbox"                             │
│  ├── 4. Publica en RabbitMQ                            │
│  └── 5. Marca fila outbox como "PROCESSED"             │
└────────────────────────────────────────────────────────┘
```

1. La escritura en la base de datos de negocio y la inserción del evento en una tabla especial llamada `outbox` se realizan en la **misma transacción de base de datos**.
2. Un proceso worker ligero (*Outbox Poller*) lee periódicamente la tabla `outbox` buscando registros no procesados, los publica en RabbitMQ y luego los marca como completados. Esto garantiza que ningún evento de gamificación se pierda (*At-Least-Once Delivery*).

---

## 3. Coordinación de Transacciones: Patrón Saga (Coreografía)

Cuando el usuario canjea un cupón costoso en el marketplace, se requiere verificar su saldo de XP en `gamification-service` y emitir el cupón en `reward-service`. Se implementa una **Saga basada en Coreografía**:
1. El usuario solicita un canje. `reward-service` emite una transacción local en estado `PENDING_VALIDATION` y publica el evento `REWARD_CLAIM_STARTED`.
2. El microservicio `gamification-service` consume el evento, verifica si el usuario posee suficiente XP:
   - **Caso Exitoso**: Deduce el XP y emite `XP_DEDUCTION_SUCCESSFUL`.
   - **Caso Fallido (Mensaje de Compensación)**: Si no tiene XP suficiente, publica `XP_DEDUCTION_FAILED`.
3. `reward-service` recibe el resultado:
   - Si fue exitoso, marca el cupón como `ACTIVE`.
   - Si falló (evento de compensación), revierte la transacción local, marcando el canje como `CANCELLED` y libera el catálogo.

---

## 4. Bloqueos Distribuidos (Distributed Locks con Redis)

Para evitar que un usuario reclame múltiples veces un cupón limitado de stock (ej. "Sólo 10 cafés gratis hoy") realizando peticiones paralelas ultra-rápidas que burlen la validación tradicional, se utiliza un bloqueo distribuido en Redis:
* **Algoritmo**: Redlock simple.
* **Flujo**:
  - Al recibir la petición de canje para un premio escaso, el microservicio de recompensas intenta adquirir una llave en Redis: `SET lock:reward:rew_cafe_gratis uuid_usuario NX PX 5000` (bloqueo por 5 segundos).
  - Si la llave ya existe, se rechaza la petición concurrente inmediatamente con código `409 Conflict`.
  - Una vez procesada la transacción, se libera la llave de Redis de manera segura.
