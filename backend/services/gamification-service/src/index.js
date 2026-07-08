const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { EventBus } = require('common');
const leaderboardService = require('./services/leaderboardService');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('gamification-service');

const dbDir = path.join(__dirname, '../../../../.local_db');
const progressPath = path.join(dbDir, 'progress.json');
const badgesPath = path.join(dbDir, 'badges.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(progressPath)) {
  fs.writeFileSync(progressPath, JSON.stringify({}));
}
if (!fs.existsSync(badgesPath)) {
  fs.writeFileSync(badgesPath, JSON.stringify({}));
}

// Hardcoded Missions
const MISSIONS = [
  {
    id: 'm_plaza_grande',
    title: 'Exploración de la Plaza Mayor',
    description: 'Realiza un check-in en el centro del poder político y civil colonial de Quito.',
    xpReward: 100,
    poiId: 'plaza_grande'
  },
  {
    id: 'm_san_francisco',
    title: 'El Pacto de Cantuña',
    description: 'Visita el atrio de la Iglesia de San Francisco donde Cantuña burló al diablo.',
    xpReward: 150,
    poiId: 'san_francisco'
  },
  {
    id: 'm_basilica',
    title: 'Escalador de Torres',
    description: 'Sube a la cima neogótica de la Basílica del Voto Nacional.',
    xpReward: 200,
    poiId: 'basilica'
  },
  {
    id: 'm_panecillo',
    title: 'La Virgen Alada',
    description: 'Sube a la loma de El Panecillo y admira la estatua metálica de la virgen.',
    xpReward: 180,
    poiId: 'el_panecillo'
  },
  {
    id: 'm_la_ronda',
    title: 'Ruta Bohemia',
    description: 'Disfruta un chocolate caliente o empanada de viento en la tradicional calle La Ronda.',
    xpReward: 120,
    poiId: 'la_ronda'
  }
];

function readProgress() {
  const data = fs.readFileSync(progressPath, 'utf8');
  return JSON.parse(data || '{}');
}

function writeProgress(data) {
  fs.writeFileSync(progressPath, JSON.stringify(data, null, 2));
}

function readBadges() {
  const data = fs.readFileSync(badgesPath, 'utf8');
  return JSON.parse(data || '{}');
}

function writeBadges(data) {
  fs.writeFileSync(badgesPath, JSON.stringify(data, null, 2));
}

// Subscribe to POI_VISITED
async function initEventBus() {
  await eventBus.connect();
  await eventBus.subscribe('POI_VISITED', async (eventData) => {
    const { userId, poiId } = eventData;
    console.log(`[GamificationService] Procesando check-in de usuario: ${userId} en POI: ${poiId}`);

    try {
      const progress = readProgress();
      if (!progress[userId]) {
        progress[userId] = { xp: 0, level: 1, completedMissions: [], username: eventData.username || 'Explorador' };
      }

      // Check if mission for this POI exists and isn't completed yet
      const mission = MISSIONS.find(m => m.poiId === poiId);
      if (!mission) return;

      if (progress[userId].completedMissions.includes(mission.id)) {
        console.log(`[GamificationService] Misión ${mission.id} ya completada por el usuario ${userId}`);
        return;
      }

      // Complete mission
      progress[userId].completedMissions.push(mission.id);
      const originalXP = progress[userId].xp;
      const xpEarned = mission.xpReward;
      const newXP = originalXP + xpEarned;
      
      // Calculate level (100 XP per level threshold)
      const newLevel = Math.floor(newXP / 100) + 1;
      const levelUp = newLevel > progress[userId].level;

      progress[userId].xp = newXP;
      progress[userId].level = newLevel;

      writeProgress(progress);

      // Actualiza el Leaderboard global en Redis Sorted Sets (ZINCRBY).
      // Si Redis no está disponible, el ranking sigue funcionando leyendo
      // el JSON local (ver endpoint GET /leaderboard más abajo).
      await leaderboardService.addScore(userId, xpEarned, progress[userId].username);

      // Publish events
      await eventBus.publish('MISSION_COMPLETED', {
        userId,
        missionId: mission.id,
        title: mission.title,
        xpEarned
      });

      await eventBus.publish('XP_UPDATED', {
        userId,
        newXP,
        newLevel,
        levelUp
      });

      // Handle unlocking badges
      const badges = readBadges();
      if (!badges[userId]) {
        badges[userId] = [];
      }

      const unlockedBadges = badges[userId];
      
      // Unlock "Primer Explorador" badge
      if (unlockedBadges.length === 0) {
        const badge = {
          id: 'badge_first_step',
          name: 'Primer Paso',
          description: 'Otorgado por hacer tu primer check-in en QuitoQuest.',
          unlockedAt: new Date().toISOString()
        };
        unlockedBadges.push(badge);
        await eventBus.publish('BADGE_UNLOCKED', { userId, badge });
      }

      // Unlock special badge for San Francisco
      if (poiId === 'san_francisco' && !unlockedBadges.some(b => b.id === 'badge_cantuna')) {
        const badge = {
          id: 'badge_cantuna',
          name: 'Amigo de Cantuña',
          description: 'Completaste el reto de la Iglesia de San Francisco.',
          unlockedAt: new Date().toISOString()
        };
        unlockedBadges.push(badge);
        await eventBus.publish('BADGE_UNLOCKED', { userId, badge });
      }

      writeBadges(badges);

    } catch (err) {
      console.error('[GamificationService] Error al procesar POI_VISITED:', err.message);
    }
  });
}

initEventBus();

// Routes
app.get('/missions', (req, res) => {
  res.json({ success: true, missions: MISSIONS });
});

app.get('/progress/:userId', (req, res) => {
  try {
    const progress = readProgress();
    const userProgress = progress[req.params.userId] || { xp: 0, level: 1, completedMissions: [] };
    res.json({ success: true, progress: userProgress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/badges/:userId', (req, res) => {
  try {
    const badges = readBadges();
    const userBadges = badges[req.params.userId] || [];
    res.json({ success: true, badges: userBadges });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    // Fuente primaria: Redis Sorted Set (ZREVRANGE), O(log N + M).
    const redisLeaderboard = await leaderboardService.getTop(limit);
    if (redisLeaderboard) {
      return res.json({ success: true, source: 'redis', leaderboard: redisLeaderboard });
    }

    // Fallback: si Redis no esta disponible, se calcula desde el JSON local.
    const progress = readProgress();
    const leaderboard = Object.keys(progress).map(userId => ({
      userId,
      username: progress[userId].username || 'Usuario',
      xp: progress[userId].xp,
      level: progress[userId].level
    })).sort((a, b) => b.xp - a.xp).slice(0, limit);

    res.json({ success: true, source: 'local-json-fallback', leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/leaderboard/:userId/rank', async (req, res) => {
  try {
    const rankInfo = await leaderboardService.getUserRank(req.params.userId);
    if (!rankInfo) {
      return res.status(404).json({ success: false, message: 'Usuario sin posicion registrada en el leaderboard.' });
    }
    res.json({ success: true, ...rankInfo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'gamification-service' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`[GamificationService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
