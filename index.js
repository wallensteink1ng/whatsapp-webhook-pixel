const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Liberar chamadas do seu site (CORS)
app.use(cors({
  origin: 'https://barbaracleaning.com',
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

app.post('/send', async (req, res) => {
  try {
    const { phone, service, airbnb, eircode, price } = req.body;
    const now = Math.floor(Date.now() / 1000);

    const event = {
      event_name: 'BookingConfirmed',
      event_time: now,
      event_source_url: 'https://barbaracleaning.com',
      action_source: 'website',
      user_data: {
        ph: phone
      },
      custom_data: {
        service_type: service,
        is_airbnb: airbnb === 'Sim',
        zip: eircode,
        value: price,
        currency: 'EUR',
        city: 'Dublin',
        region: 'Leinster'
      },
      event_id: `manual_${now}_${phone}`
    };

    const pixelId = process.env.PIXEL_ID;
    const accessToken = process.env.ACCESS_TOKEN;

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`,
      { data: [event] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    res.status(200).json({ success: true, result: response.data });
  } catch (error) {
    console.error('[ERRO] Falha ao enviar:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
