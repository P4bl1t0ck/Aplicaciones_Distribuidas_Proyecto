const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('analytics-service');

const dbDir = path.join(__dirname, '../../../../.local_db');
const analyticsPath = path.join(dbDir, 'analytics.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initial seed stats to display beautiful charts in React panel out-of-the-box
const SEED_STATS = [
  { type: 'CHECKIN', poiId: 'plaza_grande', timestamp: '2026-07-01T10:00:00Z' },
  { type: 'CHECKIN', poiId: 'plaza_grande', timestamp: '2026-07-01T10:15:00Z' },
  { type: 'CHECKIN', poiId: 'san_francisco', timestamp: '2026-07-01T11:30:00Z' },
  { type: 'CHECKIN', poiId: 'san_francisco', timestamp: '2026-07-01T12:00:00Z' },
  { type: 'CHECKIN', poiId: 'basilica', timestamp: '2026-07-01T14:45:00Z' },
  { type: 'REDEEMED', partnerName: 'Café Plaza Mayor', rewardId: 'rew_cafe_plaza', timestamp: '2026-07-01T16:00:00Z' },
  { type: 'REDEEMED', partnerName: 'La Casa del Canelazo', rewardId: 'rew_ronda_canelazo', timestamp: '2026-07-01T18:00:00Z' }
];

if (!fs.existsSync(analyticsPath)) {
  fs.writeFileSync(analyticsPath, JSON.stringify(SEED_STATS, null, 2));
}

function readLogs() {
  const data = fs.readFileSync(analyticsPath, 'utf8');
  return JSON.parse(data || '[]');
}

function writeLogs(logs) {
  fs.writeFileSync(analyticsPath, JSON.stringify(logs, null, 2));
}

async function initEventBus() {
  await eventBus.connect();

  await eventBus.subscribe('POI_VISITED', (data) => {
    console.log('[AnalyticsService] Registrando evento POI_VISITED para analíticas...');
    const logs = readLogs();
    logs.push({
      type: 'CHECKIN',
      poiId: data.poiId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString()
    });
    writeLogs(logs);
  });

  await eventBus.subscribe('COUPON_REDEEMED', (data) => {
    console.log('[AnalyticsService] Registrando evento COUPON_REDEEMED para analíticas...');
    const logs = readLogs();
    logs.push({
      type: 'REDEEMED',
      partnerName: data.partnerName,
      rewardId: data.rewardId,
      userId: data.userId,
      timestamp: data.timestamp || new Date().toISOString()
    });
    writeLogs(logs);
  });
}

initEventBus();

// Routes
app.get('/b2b/summary', (req, res) => {
  try {
    const logs = readLogs();
    
    // Calculate aggregate metrics
    const checkinLogs = logs.filter(l => l.type === 'CHECKIN');
    const redeemLogs = logs.filter(l => l.type === 'REDEEMED');

    // Counts per POI
    const poiCounts = {};
    checkinLogs.forEach(l => {
      poiCounts[l.poiId] = (poiCounts[l.poiId] || 0) + 1;
    });

    // Counts per Partner
    const partnerCounts = {};
    redeemLogs.forEach(l => {
      partnerCounts[l.partnerName] = (partnerCounts[l.partnerName] || 0) + 1;
    });

    // Hourly traffic distribution (simulate peak hour counts)
    const hourlyTraffic = Array(24).fill(0);
    logs.forEach(l => {
      const hour = new Date(l.timestamp).getHours();
      if (!isNaN(hour)) {
        hourlyTraffic[hour]++;
      }
    });

    res.json({
      success: true,
      totalCheckins: checkinLogs.length,
      totalRedeems: redeemLogs.length,
      poiCounts,
      partnerCounts,
      hourlyTraffic
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'analytics-service' });
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`[AnalyticsService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
