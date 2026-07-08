const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { EventBus } = require('common');

const app = express();
app.use(cors());
app.use(express.json());

const eventBus = new EventBus('reward-service');

const dbDir = path.join(__dirname, '../../../../.local_db');
const couponsPath = path.join(dbDir, 'coupons.json');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(couponsPath)) {
  fs.writeFileSync(couponsPath, JSON.stringify([]));
}

// Catalog of Partner Rewards linked to check-in landmarks
const REWARDS = [
  {
    id: 'rew_cafe_plaza',
    poiId: 'plaza_grande',
    partnerName: 'Café Plaza Mayor',
    title: 'Café Americano + Humita 2x1',
    description: 'Presenta este cupón en el local para obtener tu oferta de merienda colonial.'
  },
  {
    id: 'rew_museo_sf',
    poiId: 'san_francisco',
    partnerName: 'Museo Fray Pedro Gocial',
    title: 'Entrada Gratuita a Claustro',
    description: 'Acceso liberado para admirar el arte barroco quiteño en el convento de San Francisco.'
  },
  {
    id: 'rew_panecillo_rest',
    poiId: 'el_panecillo',
    partnerName: 'Restaurante PIM\'S El Panecillo',
    title: '15% de Descuento en Almuerzos',
    description: 'Válido de lunes a viernes con vista panorámica de la ciudad.'
  },
  {
    id: 'rew_ronda_canelazo',
    poiId: 'la_ronda',
    partnerName: 'La Casa del Canelazo',
    title: 'Canelazo Tradicional de Bienvenida Gratis',
    description: 'Prueba la bebida caliente de naranjilla con especias en tu visita nocturna.'
  }
];

function readCoupons() {
  const data = fs.readFileSync(couponsPath, 'utf8');
  return JSON.parse(data || '[]');
}

function writeCoupons(data) {
  fs.writeFileSync(couponsPath, JSON.stringify(data, null, 2));
}

// Subscribe to MISSION_COMPLETED
async function initEventBus() {
  await eventBus.connect();
  await eventBus.subscribe('MISSION_COMPLETED', async (eventData) => {
    const { userId, missionId } = eventData;
    console.log(`[RewardService] Misión completada recibida para usuario ${userId}. Generando cupón...`);

    try {
      // Find reward linked to this mission POI
      const reward = REWARDS.find(r => {
        // Simple mapping: mission id contains POI id
        return missionId.includes(r.poiId);
      });

      if (!reward) return;

      const coupons = readCoupons();
      
      // Check if coupon already generated for this user and reward
      const exists = coupons.some(c => c.userId === userId && c.rewardId === reward.id);
      if (exists) {
        console.log(`[RewardService] Cupón para ${reward.id} ya emitido al usuario ${userId}`);
        return;
      }

      // Mint new coupon
      const couponCode = `QQ-${reward.poiId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCoupon = {
        code: couponCode,
        userId,
        rewardId: reward.id,
        partnerName: reward.partnerName,
        title: reward.title,
        status: 'ACTIVE',
        issuedAt: new Date().toISOString()
      };

      coupons.push(newCoupon);
      writeCoupons(coupons);

      console.log(`[RewardService] Cupón generado exitosamente: ${couponCode}`);

      // Publish REWARD_CLAIMED
      await eventBus.publish('REWARD_CLAIMED', {
        userId,
        couponCode,
        partnerName: reward.partnerName,
        rewardTitle: reward.title
      });

    } catch (err) {
      console.error('[RewardService] Error al generar cupón:', err.message);
    }
  });
}

initEventBus();

// Routes
app.get('/catalog', (req, res) => {
  res.json({ success: true, catalog: REWARDS });
});

app.get('/coupons/:userId', (req, res) => {
  try {
    const coupons = readCoupons();
    const userCoupons = coupons.filter(c => c.userId === userIdOverride(req.params.userId));
    res.json({ success: true, coupons: userCoupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper for dev testing
function userIdOverride(id) {
  return id;
}

app.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Código de cupón requerido.' });
    }

    const coupons = readCoupons();
    const index = coupons.findIndex(c => c.code.toUpperCase() === code.toUpperCase() && c.status === 'ACTIVE');

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Cupón inválido, vencido o ya canjeado.' });
    }

    coupons[index].status = 'REDEEMED';
    coupons[index].redeemedAt = new Date().toISOString();
    writeCoupons(coupons);

    // Publish EVENT: COUPON_REDEEMED for B2B Analytics
    await eventBus.publish('COUPON_REDEEMED', {
      userId: coupons[index].userId,
      couponCode: code,
      partnerName: coupons[index].partnerName,
      rewardId: coupons[index].rewardId,
      timestamp: coupons[index].redeemedAt
    });

    return res.json({
      success: true,
      message: `¡Cupón verificado con éxito en '${coupons[index].partnerName}'!`,
      coupon: coupons[index]
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'reward-service' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`[RewardService] Ejecutándose en el puerto http://localhost:${PORT}`);
});
