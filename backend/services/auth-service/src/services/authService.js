const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const { EventBus } = require('common');

const eventBus = new EventBus('auth-service');
eventBus.connect();

const JWT_SECRET = process.env.JWT_SECRET || 'quitoquest_super_secret_key_2026';

class AuthService {
  async register({ username, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const newUser = {
      id: userId,
      username,
      email,
      passwordHash,
      role: 'TURISTA',
      createdAt: new Date().toISOString()
    };

    await userRepository.create(newUser);

    // Broadcast EVENT: USER_CREATED to configure profile and progress
    await eventBus.publish('USER_CREATED', {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email
    });

    return { id: newUser.id, username: newUser.username, email: newUser.email };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales incorrectas.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Credenciales incorrectas.');
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };
  }
}

module.exports = new AuthService();
