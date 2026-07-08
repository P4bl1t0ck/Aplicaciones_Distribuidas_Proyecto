const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'quitoquest_super_secret_key_2026';

// Define target ports for services
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  geo: process.env.GEO_SERVICE_URL || 'http://localhost:3003',
  events: process.env.EVENTS_SERVICE_URL || 'http://localhost:3004',
  gamification: process.env.GAMIFICATION_SERVICE_URL || 'http://localhost:3005',
  reward: process.env.REWARD_SERVICE_URL || 'http://localhost:3006',
  recommendation: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:3008',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009'
};

// Middleware: Authenticate and decode JWT, injecting headers to downstream microservices
const authenticateGateway = (req, res, next) => {
  // Exclude auth endpoints
  if (req.path.startsWith('/api/v1/auth')) {
    return next();
  }
  if (req.method === 'GET' && req.path.startsWith('/api/v1/geo/pois')) {
    return next();
  }
  if (req.method === 'GET' && req.path === '/api/v1/gamification/leaderboard') {
    return next();
  }
  // La agenda cultural es de consulta pública (como los POIs del mapa).
  if (req.method === 'GET' && req.path.startsWith('/api/v1/events')) {
    return next();
  }
  // Trigger del worker de scraping: no depende de un usuario logueado,
  // es un disparador administrativo/interno (igual que el cron automático).
  if (req.method === 'POST' && req.path === '/api/v1/events/scrape') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Falta el token de autenticación (JWT).' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token de autenticación inválido o expirado.' });
    }

    // Attach decoded info to req headers for downstream microservices
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-name'] = decoded.username;
    
    next();
  });
};

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: 'active',
    routesRegistered: Object.keys(SERVICES)
  });
});

// Apply JWT verification middleware globally
app.use(authenticateGateway);

// Config API Proxy routes
app.use('/api/v1/auth', proxy(SERVICES.auth, {
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => proxyReqOpts,
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => proxyResData
}));

app.use('/api/v1/users', proxy(SERVICES.user, {
  proxyReqPathResolver: (req) => {
    // Forward path correctly (remove api/v1 suffix prefix if needed, or proxy directly)
    return req.url; // e.g. /profile/123
  }
}));

app.use('/api/v1/geo', proxy(SERVICES.geo, {
  proxyReqOptDecorator: (proxyReqOpts) => {
    return proxyReqOpts;
  }
}));

app.use('/api/v1/events', proxy(SERVICES.events));
app.use('/api/v1/gamification', proxy(SERVICES.gamification));
app.use('/api/v1/rewards', proxy(SERVICES.reward));
app.use('/api/v1/recommendations', proxy(SERVICES.recommendation));
app.use('/api/v1/analytics', proxy(SERVICES.analytics));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`[API-Gateway] Corriendo en http://localhost:${PORT}`);
});
