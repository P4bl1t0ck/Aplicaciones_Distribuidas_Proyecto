const cron = require('node-cron');
const { runScraper } = require('../scrapers/culturaScraper');
const eventsRepository = require('../repositories/eventsRepository');

/**
 * Worker asíncrono de la agenda cultural (deliverable del Sprint 3:
 * "events-service cargando dinámicamente actividades de la agenda cultural").
 *
 * Corre el scraper cada CULTURA_SCRAPER_CRON minutos (por defecto cada 15
 * minutos) y publica EVENT_CREATED en el bus de eventos únicamente por
 * los eventos nuevos, para no inundar a los consumidores con duplicados.
 */
function startScrapeScheduler(eventBus) {
  const cronExpression = process.env.CULTURA_SCRAPER_CRON || '*/15 * * * *';

  const executeJob = async () => {
    try {
      const scrapedEvents = await runScraper();
      let createdCount = 0;

      for (const event of scrapedEvents) {
        const { event: savedEvent, wasCreated } = eventsRepository.upsertBySourceId(event);
        if (wasCreated) {
          createdCount += 1;
          await eventBus.publish('EVENT_CREATED', savedEvent);
        }
      }

      console.log(`[ScrapeScheduler] Corrida completada: ${scrapedEvents.length} eventos procesados, ${createdCount} nuevos publicados.`);
    } catch (err) {
      console.error('[ScrapeScheduler] Error durante la corrida programada:', err.message);
    }
  };

  cron.schedule(cronExpression, executeJob);
  console.log(`[ScrapeScheduler] Worker programado con expresión cron "${cronExpression}".`);

  // Ejecuta una vez al arrancar el servicio, para tener datos frescos de inmediato.
  executeJob();
}

module.exports = { startScrapeScheduler };
