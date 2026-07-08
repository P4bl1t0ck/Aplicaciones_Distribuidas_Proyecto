const redisWrapper = require('../cache/redisClient');

const LEADERBOARD_KEY = 'quitoquest:leaderboard:global';
const USERNAMES_HASH_KEY = 'quitoquest:leaderboard:usernames';

/**
 * Encapsula toda la lógica del ranking global de exploradores.
 *
 * Estructura de datos en Redis (ver docs/05_modelo_datos.md, sección 3.B):
 *  - ZSET  "quitoquest:leaderboard:global"     -> { userId: xpTotal }
 *  - HASH  "quitoquest:leaderboard:usernames"  -> { userId: username }
 *
 * Comandos aplicados:
 *  - ZINCRBY  para sumar XP de forma atómica cuando se completa una misión.
 *  - ZREVRANGE WITHSCORES para obtener el Top N de exploradores.
 *  - ZREVRANK / ZSCORE para la posición y puntaje de un usuario específico.
 */
class LeaderboardService {
  constructor() {
    this.redis = redisWrapper.connect();
  }

  /**
   * Suma XP a un usuario en el leaderboard y guarda su username.
   * Se llama cada vez que gamification-service procesa POI_VISITED.
   */
  async addScore(userId, xpDelta, username) {
    if (!redisWrapper.isReady) return null;

    try {
      const newScore = await this.redis.zincrby(LEADERBOARD_KEY, xpDelta, userId);
      if (username) {
        await this.redis.hset(USERNAMES_HASH_KEY, userId, username);
      }
      return Number(newScore);
    } catch (err) {
      console.warn('[LeaderboardService] Error al actualizar ZSET en Redis:', err.message);
      return null;
    }
  }

  /**
   * Obtiene el Top N de exploradores ordenados por XP descendente.
   */
  async getTop(n = 10) {
    if (!redisWrapper.isReady) return null; // el caller decide el fallback

    try {
      const raw = await this.redis.zrevrange(LEADERBOARD_KEY, 0, n - 1, 'WITHSCORES');
      const usernames = await this.redis.hgetall(USERNAMES_HASH_KEY);

      const leaderboard = [];
      for (let i = 0; i < raw.length; i += 2) {
        const userId = raw[i];
        const xp = Number(raw[i + 1]);
        leaderboard.push({
          userId,
          username: usernames[userId] || 'Explorador',
          xp,
          level: Math.floor(xp / 100) + 1
        });
      }
      return leaderboard;
    } catch (err) {
      console.warn('[LeaderboardService] Error al leer ZSET de Redis:', err.message);
      return null;
    }
  }

  /**
   * Devuelve la posición (rank, base 1) y el XP total de un usuario puntual.
   */
  async getUserRank(userId) {
    if (!redisWrapper.isReady) return null;

    try {
      const [rank, score] = await Promise.all([
        this.redis.zrevrank(LEADERBOARD_KEY, userId),
        this.redis.zscore(LEADERBOARD_KEY, userId)
      ]);

      if (rank === null || score === null) return null;

      return { rank: rank + 1, xp: Number(score) };
    } catch (err) {
      console.warn('[LeaderboardService] Error al calcular ranking de usuario:', err.message);
      return null;
    }
  }
}

module.exports = new LeaderboardService();
