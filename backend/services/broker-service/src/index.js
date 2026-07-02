const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map of subscriptions: key: routingKey, value: Set of socketIds
const subscriptions = {};

// Map of socket ID to service name
const connectedServices = {};

io.on('connection', (socket) => {
  const serviceName = socket.handshake.query.serviceName || 'unknown';
  connectedServices[socket.id] = serviceName;
  console.log(`[Broker] Servicio '${serviceName}' conectado (${socket.id})`);

  socket.on('subscribe', (routingKey) => {
    if (!subscriptions[routingKey]) {
      subscriptions[routingKey] = new Set();
    }
    subscriptions[routingKey].add(socket.id);
    console.log(`[Broker] Servicio '${serviceName}' se suscribió a [${routingKey}]`);
  });

  socket.on('publish', ({ routingKey, message }) => {
    console.log(`[Broker] Evento recibido [${routingKey}] de '${serviceName}':`, JSON.stringify(message.data));
    
    // Find all sockets subscribed to this routing key or matching topics
    const subscribers = subscriptions[routingKey] || new Set();
    
    // Wildcard matching (simple topic matching: e.g., 'POI.*' matches 'POI.visited')
    Object.keys(subscriptions).forEach(key => {
      if (key.includes('*')) {
        const regexStr = '^' + key.replace('.', '\\.').replace('*', '.*') + '$';
        const regex = new RegExp(regexStr);
        if (regex.test(routingKey)) {
          subscriptions[key].forEach(sid => subscribers.add(sid));
        }
      }
    });

    let routedCount = 0;
    subscribers.forEach((sid) => {
      if (io.sockets.sockets.has(sid)) {
        io.to(sid).emit(routingKey, message);
        routedCount++;
      } else {
        // Clean up stale socket
        subscribers.delete(sid);
      }
    });
    
    console.log(`[Broker] Evento [${routingKey}] ruteado a ${routedCount} suscriptores.`);
  });

  socket.on('disconnect', () => {
    const sName = connectedServices[socket.id];
    delete connectedServices[socket.id];
    console.log(`[Broker] Servicio '${sName}' desconectado (${socket.id})`);
    
    // Remove from subscriptions
    Object.keys(subscriptions).forEach((key) => {
      subscriptions[key].delete(socket.id);
      if (subscriptions[key].size === 0) {
        delete subscriptions[key];
      }
    });
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeServices: Object.values(connectedServices),
    subscriptions: Object.keys(subscriptions)
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Broker] Servidor Mock Broker ejecutándose en http://localhost:${PORT}`);
});
