const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.post('/register', authController.register);
app.post('/login', authController.login);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[AuthService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
