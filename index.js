const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accessToken = process.env.ACCESS_TOKEN;
const pixelId = process.env.PIXEL_ID;

function hashSha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

app.post('/send', async (req, res) => {
  try {
    const { phone, service_type, is_airbnb, eircode, value } = req.body;
    const fbc = req.body.fbc || '';
    const fbp = req.body.fbp || '';

    const user_data = {
      ph: hashSha256(phone),
      client_ip_address: req.ip,
      client_user_agent: req.get('User-Agent'),
      fbc,
      fbp,
      external_id: hashSha256(phone),
    };

    const custom_data = {
      service_type,
      is_airbnb,
      eircode: eircode?.toUpperCase() || null,
      value: parseFloat(value) || null,
      currency: 'EUR',
    };

    const payload = {
      data: [
        {
          event_name: 'BookingConfirmed',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data,
          custom_data
        },
      ],
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('[ERRO] Falha ao enviar:', result);
      return res.status(500).json({ success: false, error: result });
    }

    console.log('[OK] Evento enviado com sucesso:', result);
    res.json({ success: true });
  } catch (error) {
    console.error('[ERRO] Erro inesperado:', error);
    res.status(500).json({ success: false, error: 'Erro inesperado no servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
