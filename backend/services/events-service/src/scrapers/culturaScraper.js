const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper de la agenda cultural de Quito.
 *
 * Intenta descargar y parsear el HTML del portal configurado en
 * CULTURA_SCRAPER_URL (variable de entorno). El HTML de portales
 * municipales cambia con frecuencia y no siempre es accesible desde un
 * entorno de desarrollo/CI, así que el scraper sigue el mismo patrón de
 * resiliencia que ya usa el EventBus (backend/common/eventBus.js):
 * si el request real falla (timeout, 404, cambio de estructura, etc.),
 * cae a un conjunto de eventos simulados para no romper el flujo del
 * Sprint 3 (esto reemplaza el endpoint POST /scrape "mock" del Sprint 1).
 *
 * Para producción: ajustar SELECTORS según el HTML real del portal y
 * definir CULTURA_SCRAPER_URL apuntando al sitio real.
 */

const SELECTORS = {
  eventCard: '.agenda-item, .evento-card, article',
  title: '.titulo, h2, h3',
  description: '.descripcion, p',
  date: '.fecha, time',
  location: '.lugar, .ubicacion'
};

const FALLBACK_POOL = [
  {
    title: 'Feria de Sabores Populares',
    description: 'Muestra gastronómica artesanal con productores locales en la Calle La Ronda.',
    location: 'Calle La Ronda',
    category: 'GASTRONOMIA'
  },
  {
    title: 'Recital de Música Andina Contemporánea',
    description: 'Fusión de instrumentos autóctonos con sonidos electrónicos en el Teatro Nacional.',
    location: 'Teatro Nacional Sucre',
    category: 'MUSICA'
  },
  {
    title: 'Exposición Itinerante: Quito Colonial en Fotografías',
    description: 'Muestra fotográfica del Centro Histórico a lo largo del siglo XX.',
    location: 'Centro Cultural Metropolitano',
    category: 'ARTE'
  },
  {
    title: 'Ruta Guiada por las Iglesias del Centro Histórico',
    description: 'Recorrido guiado por San Francisco, La Compañía y la Catedral Primada.',
    location: 'Centro Histórico',
    category: 'HISTORIA'
  }
];

function buildEventFromScrapedNode($, node) {
  const title = $(node).find(SELECTORS.title).first().text().trim();
  const description = $(node).find(SELECTORS.description).first().text().trim();
  const date = $(node).find(SELECTORS.date).first().text().trim();
  const location = $(node).find(SELECTORS.location).first().text().trim();

  if (!title) return null;

  return {
    sourceId: `scraped_${Buffer.from(title).toString('base64').slice(0, 16)}`,
    title,
    description: description || 'Actividad de la agenda cultural municipal.',
    date: date || new Date().toISOString().split('T')[0],
    time: '',
    location: location || 'Quito, Ecuador',
    category: 'AGENDA_MUNICIPAL'
  };
}

async function scrapeRealPortal(url) {
  const response = await axios.get(url, { timeout: 8000 });
  const $ = cheerio.load(response.data);

  const events = [];
  $(SELECTORS.eventCard).each((_, node) => {
    const event = buildEventFromScrapedNode($, node);
    if (event) events.push(event);
  });

  return events;
}

function buildFallbackEvents() {
  const pick = FALLBACK_POOL[Math.floor(Math.random() * FALLBACK_POOL.length)];
  const timestamp = Date.now();

  return [{
    sourceId: `fallback_${timestamp}`,
    title: pick.title,
    description: pick.description,
    date: new Date().toISOString().split('T')[0],
    time: '10:00 - 18:00',
    location: pick.location,
    category: pick.category
  }];
}

/**
 * Punto de entrada del worker. Devuelve siempre un arreglo de eventos
 * normalizados con `sourceId` (usado por el repositorio para hacer upsert
 * y evitar duplicados en cada corrida del cron).
 */
async function runScraper() {
  const targetUrl = process.env.CULTURA_SCRAPER_URL;

  if (!targetUrl) {
    console.log('[CulturaScraper] CULTURA_SCRAPER_URL no configurada. Usando datos simulados.');
    return buildFallbackEvents();
  }

  try {
    console.log(`[CulturaScraper] Scrapeando portal cultural: ${targetUrl}`);
    const events = await scrapeRealPortal(targetUrl);

    if (events.length === 0) {
      console.warn('[CulturaScraper] El portal respondió pero no se encontraron eventos con los selectores actuales. Usando fallback.');
      return buildFallbackEvents();
    }

    return events;
  } catch (err) {
    console.warn(`[CulturaScraper] Fallo el scraping real (${err.message}). Usando datos simulados.`);
    return buildFallbackEvents();
  }
}

module.exports = { runScraper };
