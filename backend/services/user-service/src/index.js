const express = require('express');
const cors = require('cors');
const userProfileRepository = require('./repositories/userProfileRepository');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('user-service');

// Subscribe to USER_CREATED
async function initEventBus() {
  await eventBus.connect();
  await eventBus.subscribe('USER_CREATED', async (data) => {
    console.log('[UserService] Recibido USER_CREATED para inicializar perfil:', data.userId);
    try {
      await userProfileRepository.createOrUpdate(data.userId, {
        interests: ['HISTORIA', 'GASTRONOMIA'] // Default initial interests
      });
    } catch (err) {
      console.error('[UserService] Error al inicializar perfil:', err.message);
    }
  });
}

initEventBus();

// Routes
app.get('/profile/:userId', async (req, res) => {
  try {
    const profile = await userProfileRepository.findByUserId(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
    }
    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/profile/:userId', async (req, res) => {
  try {
    const { interests, avatarUrl, bio } = req.body;
    const profile = await userProfileRepository.createOrUpdate(req.params.userId, {
      interests,
      avatarUrl,
      bio
    });
    return res.json({ success: true, profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[UserService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
