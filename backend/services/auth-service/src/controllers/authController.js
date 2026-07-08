const authService = require('../services/authService');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
      }
      const user = await authService.register({ username, email, password });
      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente.',
        userId: user.id,
        user
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
      }
      const data = await authService.login({ email, password });
      return res.status(200).json({ success: true, ...data });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new AuthController();
