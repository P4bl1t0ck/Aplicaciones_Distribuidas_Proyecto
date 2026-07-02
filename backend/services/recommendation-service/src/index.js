const express = require('express');
const cors = require('cors');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('recommendation-service');
eventBus.connect();

const RECOMMENDATION_ITEMS = [
  {
    poiId: 'plaza_grande',
    title: 'Visita el Palacio de Carondelet',
    reason: 'Porque te apasiona la HISTORIA y la arquitectura colonial.',
    category: 'HISTORIA'
  },
  {
    poiId: 'san_francisco',
    title: 'Explora las Leyendas de San Francisco',
    reason: 'Recomendado basado en tu interés en ARTE barroco e historia.',
    category: 'HISTORIA'
  },
  {
    poiId: 'basilica',
    title: 'Fotografía desde las torres de la Basílica',
    reason: 'Basado en tus preferencias de FOTOGRAFIA y arquitectura gótica.',
    category: 'ARTE'
  },
  {
    poiId: 'la_ronda',
    title: 'Cena típica en Calle La Ronda',
    reason: 'Recomendado por tu interés en GASTRONOMIA quiteña y música en vivo.',
    category: 'GASTRONOMIA'
  },
  {
    poiId: 'el_panecillo',
    title: 'Paseo escénico al Panecillo',
    reason: 'Recomendado para disfrutar vistas de NATURALEZA y paisajes urbanos.',
    category: 'NATURALEZA'
  }
];

// Routes
app.get('/recommendations/:userId', async (req, res) => {
  try {
    // In production, we would fetch profile from user-service: `http://localhost:3002/profile/${userId}`
    // For demo simplicity, we will dynamically inspect interests from body or defaults.
    const userInterests = req.query.interests 
      ? req.query.interests.split(',') 
      : ['GASTRONOMIA', 'HISTORIA'];

    console.log(`[RecommendationEngine] Procesando recomendaciones para usuario: ${req.params.userId} con intereses:`, userInterests);

    // Filter items matching interests
    const matches = RECOMMENDATION_ITEMS.filter(item => 
      userInterests.some(interest => item.category === interest.toUpperCase())
    );

    // Fallback: If no interests match, return all items
    const recommendations = matches.length > 0 ? matches : RECOMMENDATION_ITEMS;

    res.json({
      success: true,
      interestsAnalized: userInterests,
      recommendations: recommendations.slice(0, 3) // Return top 3
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'recommendation-service' });
});

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
  console.log(`[RecommendationService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
