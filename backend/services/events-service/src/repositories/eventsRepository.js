const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../../../../.local_db');
const dbPath = path.join(dbDir, 'events.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

/**
 * Repositorio de la agenda cultural. Sigue el mismo patrón que
 * backend/services/auth-service/src/repositories/userRepository.js
 * (persistencia JSON local, con el contrato listo para migrar a MongoDB
 * usando las mismas operaciones: findAll, findById, upsertBySourceId, create).
 */
class EventsRepository {
  _read() {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '[]');
  }

  _write(events) {
    fs.writeFileSync(dbPath, JSON.stringify(events, null, 2));
  }

  findAll() {
    return this._read();
  }

  findById(id) {
    return this._read().find(e => e.id === id);
  }

  create(event) {
    const events = this._read();
    events.push(event);
    this._write(events);
    return event;
  }

  /**
   * Inserta un evento si no existe (por sourceId) o lo actualiza si ya existía.
   * Usado por el scraper para evitar duplicar eventos en cada corrida.
   * Retorna { event, wasCreated }.
   */
  upsertBySourceId(event) {
    const events = this._read();
    const index = events.findIndex(e => e.sourceId && e.sourceId === event.sourceId);

    if (index === -1) {
      events.push(event);
      this._write(events);
      return { event, wasCreated: true };
    }

    events[index] = { ...events[index], ...event };
    this._write(events);
    return { event: events[index], wasCreated: false };
  }
}

module.exports = new EventsRepository();
