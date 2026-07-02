const express = require('express');
const cors = require('cors');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('geo-service');
eventBus.connect();

// Hardcoded Points of Interest in Quito
const POIS = [
  {
    id: 'plaza_grande',
    name: 'Plaza de la Independencia (Plaza Grande)',
    lat: -0.22016,
    lng: -78.51214,
    description: 'El corazón del Centro Histórico de Quito, rodeado por el Palacio de Carondelet.'
  },
  {
    id: 'san_francisco',
    name: 'Iglesia de San Francisco',
    lat: -0.22055,
    lng: -78.51428,
    description: 'Una de las estructuras religiosas coloniales más imponentes de América Latina.'
  },
  {
    id: 'basilica',
    name: 'Basílica del Voto Nacional',
    lat: -0.21473,
    lng: -78.50731,
    description: 'La basílica neogótica más grande del continente americano, famosa por sus gárgolas de fauna nacional.'
  },
  {
    id: 'el_panecillo',
    name: 'Virgen de El Panecillo',
    lat: -0.23018,
    lng: -78.51855,
    description: 'La estatua de aluminio de la Virgen alada que vigila la ciudad desde la colina de El Panecillo.'
  },
  {
    id: 'la_ronda',
    name: 'Calle La Ronda',
    lat: -0.22485,
    lng: -78.51522,
    description: 'Una estrecha y romántica calle peatonal empedrada, llena de arte, música y comida tradicional.'
  }
];

// Haversine Formula for distance between two points in meters
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
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

  return R * c; // in meters
}

// Routes
app.get('/pois', (req, res) => {
  res.json({ success: true, pois: POIS });
});

app.post('/check-in', async (req, res) => {
  try {
    const { poiId, userLocation, userId } = req.body;
    if (!poiId || !userLocation || !userId) {
      return res.status(400).json({ success: false, message: 'Faltan parámetros de check-in.' });
    }

    const poi = POIS.find(p => p.id === poiId);
    if (!poi) {
      return res.status(404).json({ success: false, message: 'Punto de interés no registrado.' });
    }

    const distance = getDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      poi.lat,
      poi.lng
    );

    // Geofencing limit: 50 meters
    const isVerified = distance <= 50;

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: `Ubicación demasiado lejana del checkpoint. Estás a ${Math.round(distance)}m (Máximo permitido: 50m).`
      });
    }

    // Publish POI_VISITED to event bus
    await eventBus.publish('POI_VISITED', {
      userId,
      poiId,
      poiName: poi.name,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      verified: true,
      distance: Math.round(distance),
      message: `¡Check-in verificado! Has visitado '${poi.name}'`
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
  console.log(`[GeoService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
