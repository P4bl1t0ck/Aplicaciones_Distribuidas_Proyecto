require('dotenv').config();
const amqp = require('amqplib');
const io = require('socket.io-client');

class EventBus {
  constructor(serviceName) {
    this.serviceName = serviceName || 'unknown-service';
    this.mode = 'mock'; // 'rabbitmq' or 'mock'
    this.amqpConn = null;
    this.amqpChannel = null;
    this.socket = null;
    this.exchangeName = 'quitoquest.events';
  }

  async connect() {
    const amqpUrl = process.env.RABBITMQ_URL;
    if (amqpUrl) {
      try {
        console.log(`[EventBus - ${this.serviceName}] Intentando conectar a RabbitMQ: ${amqpUrl}`);
        this.amqpConn = await amqp.connect(amqpUrl);
        this.amqpChannel = await this.amqpConn.createChannel();
        await this.amqpChannel.assertExchange(this.exchangeName, 'topic', { durable: true });
        this.mode = 'rabbitmq';
        console.log(`[EventBus - ${this.serviceName}] Conectado a RabbitMQ exitosamente.`);
        return;
      } catch (err) {
        console.warn(`[EventBus - ${this.serviceName}] Error conectando a RabbitMQ: ${err.message}. Cayendo en modo Mock Broker.`);
      }
    }

    // Fallback: Mock socket broker
    const brokerUrl = process.env.BROKER_URL || 'http://localhost:5000';
    console.log(`[EventBus - ${this.serviceName}] Conectando a Mock Broker WebSocket: ${brokerUrl}`);
    
    this.socket = io(brokerUrl, {
      transports: ['websocket'],
      autoConnect: true,
      query: { serviceName: this.serviceName }
    });

    this.socket.on('connect', () => {
      console.log(`[EventBus - ${this.serviceName}] Conectado al Mock Broker WebSocket.`);
    });

    this.socket.on('connect_error', (err) => {
      // Quiet fail to avoid logging noise
    });

    this.mode = 'mock';
  }

  async publish(routingKey, payload) {
    const message = {
      event: routingKey,
      sender: this.serviceName,
      data: payload,
      timestamp: new Date().toISOString()
    };

    if (this.mode === 'rabbitmq') {
      try {
        const buffer = Buffer.from(JSON.stringify(message));
        this.amqpChannel.publish(this.exchangeName, routingKey, buffer);
        console.log(`[EventBus - ${this.serviceName}] Publicado evento RabbitMQ [${routingKey}]:`, payload);
      } catch (err) {
        console.error(`[EventBus - ${this.serviceName}] Error al publicar en RabbitMQ:`, err);
      }
    } else {
      if (this.socket && this.socket.connected) {
        this.socket.emit('publish', { routingKey, message });
        console.log(`[EventBus - ${this.serviceName}] Publicado evento Mock [${routingKey}]:`, payload);
      } else {
        console.warn(`[EventBus - ${this.serviceName}] Mock Broker desconectado. Imposible publicar [${routingKey}].`);
      }
    }
  }

  async subscribe(routingKey, callback) {
    if (this.mode === 'rabbitmq') {
      try {
        const queueName = `${this.serviceName}.${routingKey}`;
        const q = await this.amqpChannel.assertQueue(queueName, { durable: true });
        await this.amqpChannel.bindQueue(q.queue, this.exchangeName, routingKey);
        
        this.amqpChannel.consume(q.queue, (msg) => {
          if (msg !== null) {
            try {
              const content = JSON.parse(msg.content.toString());
              console.log(`[EventBus - ${this.serviceName}] Recibido evento RabbitMQ [${routingKey}]`);
              callback(content.data, content);
              this.amqpChannel.ack(msg);
            } catch (err) {
              console.error(`[EventBus - ${this.serviceName}] Error procesando mensaje RabbitMQ:`, err);
              this.amqpChannel.nack(msg, false, false); // DLQ or drop
            }
          }
        });
        console.log(`[EventBus - ${this.serviceName}] Suscrito a RabbitMQ: ${routingKey}`);
      } catch (err) {
        console.error(`[EventBus - ${this.serviceName}] Error al suscribirse en RabbitMQ:`, err);
      }
    } else {
      if (!this.socket) {
        throw new Error('EventBus no está conectado. Llama a connect() primero.');
      }
      // Register subscription on mock server
      this.socket.emit('subscribe', routingKey);
      
      this.socket.on(routingKey, (packet) => {
        console.log(`[EventBus - ${this.serviceName}] Recibido evento Mock [${routingKey}]`);
        callback(packet.data, packet);
      });
      console.log(`[EventBus - ${this.serviceName}] Suscrito a Mock Broker: ${routingKey}`);
    }
  }
}

module.exports = EventBus;
