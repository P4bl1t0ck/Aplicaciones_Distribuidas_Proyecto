const express = require('express');
const cors = require('cors');
const { EventBus } = require('common');
const eventsRepository = require('./repositories/eventsRepository');
const { runScraper } = require('./scrapers/culturaScraper');
const { startScrapeScheduler } = require('./jobs/scrapeScheduler');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('events-service');

// Initial seed events (agenda cultural base, sourceId fijo para que el
// scraper no los duplique en corridas futuras).
const SEED_EVENTS = [
  {
    id: 'evt_colada_morada',
    sourceId: 'seed_colada_morada',
    title: 'Festival de la Colada Morada y Guaguas de Pan',
    description: 'Encuentro gastronómico en la Plaza de la Independencia con chefs locales.',
    date: '2026-11-02',
    time: '10:00 - 18:00',
    location: 'Plaza Grande',
    category: 'GASTRONOMIA'
  },
  {
    id: 'evt_visita_teatralizada',
    sourceId: 'seed_visita_teatralizada',
    title: 'Visita Nocturna Teatralizada: Leyendas de Quito',
    description: 'Recorrido nocturno interactivo con actores representando a Cantuña y el Padre Almeida.',
    date: '2026-07-15',
    time: '19:30 - 22:00',
    location: 'Iglesia de San Francisco',
    category: 'HISTORIA'
  },
  {
    id: 'evt_basilica_luces',
    sourceId: 'seed_basilica_luces',
    title: 'Festival de Luces en las Cúpulas',
    description: 'Espectáculo de video mapping y luces sobre las cúpulas neogóticas de la Basílica.',
    date: '2026-08-10',
    time: '19:00 - 23:00',
    location: 'Basílica del Voto Nacional',
    category: 'ARTE'
  },
  {
    id: 'evt_musica_barroca',
    sourceId: 'seed_musica_barroca',
    title: 'Concierto de Música Barroca Quiteña',
    description: 'Interpretación de partituras coloniales de los archivos de la catedral en vivo.',
    date: '2026-07-20',
    time: '18:00 - 20:00',
    location: 'Catedral de Quito',
    category: 'MUSICA'
  }
];

function seedIfEmpty() {
  const existing = eventsRepository.findAll();
  if (existing.length === 0) {
    SEED_EVENTS.forEach(evt => eventsRepository.upsertBySourceId(evt));
  }
}

async function bootstrap() {
  seedIfEmpty();
  await eventBus.connect();

  // Worker de scraping: carga la agenda cultural de forma dinámica y
  // periódica (deliverable principal del Sprint 3 para events-service).
  startScrapeScheduler(eventBus);
}

bootstrap();

// Routes
app.get('/events', (req, res) => {
  try {
    const events = eventsRepository.findAll();
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/events/:id', (req, res) => {
  try {
    const event = eventsRepository.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado.' });
    }
    res.json({ success: true, event });
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

    const newEvent = {
      id: 'evt_' + Date.now(),
      sourceId: 'manual_' + Date.now(),
      title,
      description,
      date,
      time,
      location,
      category
    };

    eventsRepository.create(newEvent);
    await eventBus.publish('EVENT_CREATED', newEvent);

    res.status(201).json({ success: true, event: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dispara una corrida manual del scraper bajo demanda, ademas de la
// programada por CULTURA_SCRAPER_CRON en jobs/scrapeScheduler.js.
app.post('/scrape', async (req, res) => {
  try {
    console.log('[EventsService - Scraper] Ejecutando corrida manual del scraper de agenda cultural...');

    const scrapedEvents = await runScraper();
    const created = [];

    for (const event of scrapedEvents) {
      const { event: savedEvent, wasCreated } = eventsRepository.upsertBySourceId({
        id: 'evt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        ...event
      });
      if (wasCreated) {
        created.push(savedEvent);
        await eventBus.publish('EVENT_CREATED', savedEvent);
      }
    }

    res.json({
      success: true,
      message: `Scraper ejecutado con éxito. ${created.length} evento(s) nuevo(s) publicado(s).`,
      events: created
    });
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
