const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../../../../.local_db');
const dbPath = path.join(dbDir, 'profiles.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

class UserProfileRepository {
  async _read() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '[]');
  }

  async _write(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  async findByUserId(userId) {
    const profiles = await this._read();
    return profiles.find(p => p.userId === userId);
  }

  async createOrUpdate(userId, profileData) {
    const profiles = await this._read();
    let index = profiles.findIndex(p => p.userId === userId);
    
    if (index >= 0) {
      profiles[index] = { ...profiles[index], ...profileData, updatedAt: new Date().toISOString() };
    } else {
      profiles.push({
        userId,
        interests: [],
        avatarUrl: '',
        bio: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...profileData
      });
      index = profiles.length - 1;
    }
    
    await this._write(profiles);
    return profiles[index];
  }
}

module.exports = new UserProfileRepository();
