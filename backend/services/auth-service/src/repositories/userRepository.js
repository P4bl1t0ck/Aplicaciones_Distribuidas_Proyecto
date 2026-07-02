const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../../../../.local_db');
const dbPath = path.join(dbDir, 'users.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

class UserRepository {
  async _read() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '[]');
  }

  async _write(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  async findByEmail(email) {
    const users = await this._read();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findById(id) {
    const users = await this._read();
    return users.find(u => u.id === id);
  }

  async create(user) {
    const users = await this._read();
    users.push(user);
    await this._write(users);
    return user;
  }
}

module.exports = new UserRepository();
