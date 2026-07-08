# 08 - Estructura y Patrones del Backend Monorepo

El backend de **QuitoQuest** está organizado en un monorepo administrado por NPM Workspaces. Esto permite mantener librerías compartidas (como los clientes de mensajería y esquemas de validación) en una única carpeta y compilar/desplegar cada servicio por separado.

---

## 1. Organización del Código en un Servicio Core

Cada microservicio Node.js dentro de `backend/services/` implementa el patrón de **Arquitectura en Capas**:

```
services/auth-service/
├── src/
│   ├── config/        # Inicialización de bases de datos y entorno
│   ├── controllers/   # Adaptadores HTTP (parsean DTOs, invocan servicios)
│   ├── services/      # Lógica de negocio pura (reglas, validaciones, JWT)
│   ├── repositories/  # Capa de abstracción de bases de datos (consultas SQL/Mongo)
│   ├── models/        # Schemas / Entidades físicas (Sequelize, Mongoose)
│   └── index.js       # Punto de entrada de la aplicación
├── package.json
└── Dockerfile
```

### Roles de las Capas:
1. **Controllers (Controladores)**: Reciben el objeto `req` de Express, ejecutan validaciones sintácticas básicas, llaman al servicio de negocio y formatean el objeto `res`.
2. **Services (Servicios de Negocio)**: Implementan el núcleo de la aplicación. No saben si los datos provienen de HTTP, colas de RabbitMQ o gRPC. Llaman a los repositorios para obtener persistencia y disparan eventos asíncronos en el Event Bus.
3. **Repositories (Repositorios)**: Contienen las queries crudas (SQL, Mongo queries o Sequelize ORM). Abstraen la base de datos subyacente para que la capa de servicio no dependa del ORM específico.

---

## 2. Event Bus Compartido (`backend/common/eventBus.js`)

Para desacoplar el broker de mensajería (RabbitMQ/Kafka) de la lógica de negocio, se diseñó una envoltura (*wrapper*) que abstrae la infraestructura. Esto permite que el sistema funcione en local en memoria o con RabbitMQ real modificando únicamente una variable de entorno.

### Interfaz del EventBus
```javascript
class EventBus {
  // Inicializa la conexión
  async connect() { ... }

  // Publica un evento en una cola/topic
  async publish(routingKey, payload) { ... }

  // Se suscribe a eventos específicos asignándoles un callback
  async subscribe(queueName, routingKey, callback) { ... }
}
```

* **Modo Producción (RabbitMQ)**: Se conecta usando la librería `amqplib`. Crea un exchange de tipo `topic` (`quitoquest.events`). Los mensajes se formatean a JSON binario con acuses de recibo (*acknowledgements*) habilitados para garantizar entrega confiable.
* **Modo Desarrollo Local (Fallback)**: Si no se define la variable `RABBITMQ_URL` en el archivo `.env`, la clase implementa un **Broker en memoria basado en EventEmitter de Node.js** (o un pequeño servidor WebSocket en un puerto local) que retransmite los eventos entre procesos en tiempo real. Esto permite levantar el sistema completo en Windows sin tener RabbitMQ o Docker instalado.
