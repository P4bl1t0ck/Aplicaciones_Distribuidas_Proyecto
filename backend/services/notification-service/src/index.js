const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { EventBus } = require('common');

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

const eventBus = new EventBus('notification-service');

// Map of userId -> Set of socketIds
const userSockets = {};

io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    if (!userSockets[userId]) {
      userSockets[userId] = new Set();
    }
    userSockets[userId].add(socket.id);
    console.log(`[NotificationService] Cliente WebSocket conectado para usuario: ${userId} (${socket.id})`);
  }

  socket.on('disconnect', () => {
    if (userId && userSockets[userId]) {
      userSockets[userId].delete(socket.id);
      if (userSockets[userId].size === 0) {
        delete userSockets[userId];
      }
      console.log(`[NotificationService] Cliente WebSocket desconectado para usuario: ${userId}`);
    }
  });
});

function sendToUser(userId, eventName, payload) {
  const sockets = userSockets[userId];
  if (sockets) {
    sockets.forEach(sid => {
      io.to(sid).emit(eventName, payload);
    });
    console.log(`[NotificationService] Alerta enviada a usuario: ${userId} - ${eventName}`);
  } else {
    // Broadcast for demo ease
    io.emit(eventName, payload);
    console.log(`[NotificationService] Usuario no conectado. Alerta difundida de forma global: ${userId}`);
  }
}

async function initEventBus() {
  await eventBus.connect();

  // Listen for XP_UPDATED
  await eventBus.subscribe('XP_UPDATED', (data) => {
    sendToUser(data.userId, 'notification', {
      type: 'XP_UPDATED',
      title: '¡Experiencia Obtenida!',
      message: `Has ganado puntos. Nivel actual: ${data.newLevel} (XP: ${data.newXP})`,
      data
    });
  });

  // Listen for MISSION_COMPLETED
  await eventBus.subscribe('MISSION_COMPLETED', (data) => {
    sendToUser(data.userId, 'notification', {
      type: 'MISSION_COMPLETED',
      title: '🏆 ¡Misión Completada!',
      message: `Completaste: "${data.title}". ¡Recompensa generada!`,
      data
    });
  });

  // Listen for REWARD_CLAIMED
  await eventBus.subscribe('REWARD_CLAIMED', (data) => {
    sendToUser(data.userId, 'notification', {
      type: 'REWARD_CLAIMED',
      title: '🎁 ¡Premio Desbloqueado!',
      message: `Tienes un nuevo cupón: ${data.couponCode} para "${data.partnerName}".`,
      data
    });
  });
}

initEventBus();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service', connectedUsers: Object.keys(userSockets) });
});

const PORT = process.env.PORT || 3007;
server.listen(PORT, () => {
  console.log(`[NotificationService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
