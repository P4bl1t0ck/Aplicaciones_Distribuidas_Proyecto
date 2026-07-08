const express = require('express');
const cors = require('cors');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('geo-service');
const eventBusReady = eventBus.connect();

const POIS = [
  {
    id: 'plaza_grande',
    name: 'Plaza de la Independencia (Plaza Grande)',
    lat: -0.22016,
    lng: -78.51214,
    description: 'Centro historico de Quito, rodeado por el Palacio de Carondelet.'
  },
  {
    id: 'san_francisco',
    name: 'Iglesia de San Francisco',
    lat: -0.22055,
    lng: -78.51428,
    description: 'Estructura religiosa colonial representativa del Centro Historico.'
  },
  {
    id: 'basilica',
    name: 'Basilica del Voto Nacional',
    lat: -0.21473,
    lng: -78.50731,
    description: 'Basilica neogotica reconocida por sus gargolas de fauna nacional.'
  },
  {
    id: 'el_panecillo',
    name: 'Virgen de El Panecillo',
    lat: -0.23018,
    lng: -78.51855,
    description: 'Mirador patrimonial con la estatua de la Virgen alada de Quito.'
  },
  {
    id: 'la_ronda',
    name: 'Calle La Ronda',
    lat: -0.22485,
    lng: -78.51522,
    description: 'Calle peatonal historica con arte, musica y gastronomia tradicional.'
  }
];

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function parseCoordinate(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function serializePoi(poi, distanceMeters) {
  return {
    poiId: poi.id,
    name: poi.name,
    description: poi.description,
    distanceMeters: typeof distanceMeters === 'number' ? Number(distanceMeters.toFixed(2)) : undefined,
    coordinates: {
      lat: poi.lat,
      lng: poi.lng
    }
  };
}

app.get('/pois', (req, res) => {
  res.json({ success: true, pois: POIS.map(poi => serializePoi(poi)) });
});

app.get('/pois/nearby', (req, res) => {
  const lat = parseCoordinate(req.query.lat);
  const lng = parseCoordinate(req.query.lng);
  const radius = parseCoordinate(req.query.radius) || 1000;

  if (lat === null || lng === null || radius <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Los parametros lat, lng y radius deben ser coordenadas validas.'
    });
  }

  const pois = POIS
    .map((poi) => ({
      poi,
      distance: getDistanceMeters(lat, lng, poi.lat, poi.lng)
    }))
    .filter(({ distance }) => distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .map(({ poi, distance }) => serializePoi(poi, distance));

  return res.json({ success: true, pois });
});

app.post('/check-in', async (req, res) => {
  try {
    const { poiId, userLocation } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId;

    if (!poiId || !userLocation || !userId) {
      return res.status(400).json({ success: false, message: 'Faltan parametros de check-in.' });
    }

    const userLat = parseCoordinate(userLocation.lat);
    const userLng = parseCoordinate(userLocation.lng);
    if (userLat === null || userLng === null) {
      return res.status(400).json({ success: false, message: 'La ubicacion del usuario no es valida.' });
    }

    const poi = POIS.find(p => p.id === poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'Punto de interes no registrado.' });
    }

    const distance = getDistanceMeters(userLat, userLng, poi.lat, poi.lng);
    const isVerified = distance <= 50;

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        verified: false,
        distance: Math.round(distance),
        message: `Ubicacion demasiado lejana del checkpoint. Estas a ${Math.round(distance)}m. Maximo permitido: 50m.`
      });
    }

    const timestamp = new Date().toISOString();
    await eventBusReady;
    await eventBus.publish('POI_VISITED', {
      userId,
      poiId,
      poiName: poi.name,
      timestamp
    });

    return res.json({
      success: true,
      verified: true,
      distance: Math.round(distance),
      message: `Ubicacion verificada. Has ingresado al checkpoint de ${poi.name}.`,
      timestamp
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'geo-service' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`[GeoService] Ejecutandose en el puerto http://localhost:${PORT}`);
});
