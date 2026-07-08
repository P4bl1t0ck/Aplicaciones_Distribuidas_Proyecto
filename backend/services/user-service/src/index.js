const express = require('express');
const cors = require('cors');
const userProfileRepository = require('./repositories/userProfileRepository');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('user-service');

async function initEventBus() {
  await eventBus.connect();
  await eventBus.subscribe('USER_CREATED', async (data) => {
    console.log('[UserService] Recibido USER_CREATED para inicializar perfil:', data.userId);
    try {
      await userProfileRepository.createOrUpdate(data.userId, {
        interests: ['HISTORIA', 'GASTRONOMIA']
      });
    } catch (err) {
      console.error('[UserService] Error al inicializar perfil:', err.message);
    }
  });
}

initEventBus();

function getAuthenticatedUserId(req) {
  return req.headers['x-user-id'] || null;
}

function normalizeInterests(interests) {
  if (!Array.isArray(interests)) {
    return null;
  }

  return interests
    .filter((interest) => typeof interest === 'string')
    .map((interest) => interest.trim().toUpperCase())
    .filter(Boolean);
}

async function getProfile(req, res, userId) {
  let profile = await userProfileRepository.findByUserId(userId);
  if (!profile) {
    profile = await userProfileRepository.createOrUpdate(userId, {
      interests: ['HISTORIA', 'GASTRONOMIA']
    });
  }
  return res.json({ success: true, profile });
}

async function updateProfile(req, res, userId) {
  const { interests, avatarUrl, bio } = req.body;
  const normalizedInterests = interests === undefined ? undefined : normalizeInterests(interests);

  if (interests !== undefined && normalizedInterests === null) {
    return res.status(400).json({ success: false, message: 'Los intereses deben enviarse como arreglo de texto.' });
  }

  const profile = await userProfileRepository.createOrUpdate(userId, {
    interests: normalizedInterests,
    avatarUrl,
    bio
  });

  return res.json({ success: true, profile });
}

app.get('/profile/me', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario autenticado no recibido.' });
    }
    return getProfile(req, res, userId);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/profile/me', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario autenticado no recibido.' });
    }
    return updateProfile(req, res, userId);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/profile/:userId', async (req, res) => {
  try {
    return getProfile(req, res, req.params.userId);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/profile/:userId', async (req, res) => {
  try {
    return updateProfile(req, res, req.params.userId);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[UserService] Ejecutandose en el puerto http://localhost:${PORT}`);
});
