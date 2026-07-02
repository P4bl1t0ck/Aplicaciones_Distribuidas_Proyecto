const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('events-service');
eventBus.connect();

const dbDir = path.join(__dirname, '../../../../.local_db');
const dbPath = path.join(dbDir, 'events.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initial seed events
const SEED_EVENTS = [
  {
    id: 'evt_colada_morada',
    title: 'Festival de la Colada Morada y Guaguas de Pan',
    description: 'Encuentro gastronómico en la Plaza de la Independencia con chefs locales.',
    date: '2026-11-02',
    time: '10:00 - 18:00',
    location: 'Plaza Grande',
    category: 'GASTRONOMIA'
  },
  {
    id: 'evt_visita_teatralizada',
    title: 'Visita Nocturna Teatralizada: Leyendas de Quito',
    description: 'Recorrido nocturno interactivo con actores representando a Cantuña y el Padre Almeida.',
    date: '2026-07-15',
    time: '19:30 - 22:00',
    location: 'Iglesia de San Francisco',
    category: 'HISTORIA'
  },
  {
    id: 'evt_basilica_luces',
    title: 'Festival de Luces en las Cúpulas',
    description: 'Espectáculo de video mapping y luces sobre las cúpulas neogóticas de la Basílica.',
    date: '2026-08-10',
    time: '19:00 - 23:00',
    location: 'Basílica del Voto Nacional',
    category: 'ARTE'
  },
  {
    id: 'evt_musica_barroca',
    title: 'Concierto de Música Barroca Quiteña',
    description: 'Interpretación de partituras coloniales de los archivos de la catedral en vivo.',
    date: '2026-07-20',
    time: '18:00 - 20:00',
    location: 'Catedral de Quito',
    category: 'MUSICA'
  }
];

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(SEED_EVENTS, null, 2));
}

function readEvents() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data || '[]');
}

function writeEvents(events) {
  fs.writeFileSync(dbPath, JSON.stringify(events, null, 2));
}

// Routes
app.get('/events', (req, res) => {
  try {
    const events = readEvents();
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/events', async (req, res) => {
  try {
    const { title, description, date, time, location, category } = req.body;
    if (!title || !location || !category) {
      return res.status(400).json({ success: false, message: 'Campos requeridos faltantes.' });
    }

    const events = readEvents();
    const newEvent = {
      id: 'evt_' + Date.now(),
      title,
      description,
      date,
      time,
      location,
      category
    };

    events.push(newEvent);
    writeEvents(events);

    // Publish event
    await eventBus.publish('EVENT_CREATED', newEvent);

    res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mock scraper trigger
app.post('/scrape', async (req, res) => {
  try {
    console.log('[EventsService - Scraper] Ejecutando scraper worker de agendas culturales...');
    
    // Simulate finding a new event
    const events = readEvents();
    const mockScrapedEvent = {
      id: 'evt_scraped_' + Date.now(),
      title: 'Scraped: Feria de Sabores Populares',
      description: 'Agenda Municipal: Muestra gastronómica artesanal en la Calle La Ronda.',
      date: new Date().toISOString().split('T')[0],
      time: '11:00 - 17:00',
      location: 'Calle La Ronda',
      category: 'GASTRONOMIA'
    };

    events.push(mockScrapedEvent);
    writeEvents(events);

    await eventBus.publish('EVENT_CREATED', mockScrapedEvent);

    res.json({ success: true, message: 'Scraper ejecutado con éxito.', event: mockScrapedEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'events-service' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`[EventsService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
