const Redis = require('ioredis');

/**
 * Cliente Redis centralizado para gamification-service.
 * Se usa para el Leaderboard global (Redis Sorted Sets - ZSET).
 *
 * Si no se puede conectar a Redis (por ejemplo, en un entorno local sin
 * Docker levantado), el servicio sigue funcionando: leaderboardService.js
 * cae automáticamente a un ranking calculado desde el JSON local
 * (mismo patrón de resiliencia que ya usa EventBus en backend/common).
 */
class RedisClientWrapper {
  constructor() {
    this.client = null;
    this.isReady = false;
  }

  connect() {
    if (this.client) {
      return this.client;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = new Redis(redisUrl, {
      // Evita que el proceso se cuelgue reintentando infinitamente si Redis
      // no está disponible en desarrollo local.
      retryStrategy: (times) => {
        if (times > 5) {
          console.warn('[Redis] No se pudo conectar tras varios intentos. Se usará el fallback en JSON.');
          return null; // deja de reintentar
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 2,
      lazyConnect: false
    });

    this.client.on('connect', () => {
      this.isReady = true;
      console.log(`[Redis] Conectado exitosamente a ${redisUrl}`);
    });

    this.client.on('error', (err) => {
      this.isReady = false;
      console.warn(`[Redis] Error de conexión: ${err.message}`);
    });

    return this.client;
  }
}

module.exports = new RedisClientWrapper();
