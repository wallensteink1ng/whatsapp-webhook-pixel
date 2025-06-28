const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PIXEL_ID = process.env.PIXEL_ID;

function sha256(data) {
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
}

app.post('/send', async (req, res) => {
  try {
    const { phone, service, airbnb, eircode, value } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Número de telefone ausente' });
    }

    const payload = {
      data: [
        {
          event_name: 'BookingConfirmed',
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: 'https://barbaracleaning.com',
          action_source: 'website',
          user_data: {
            ph: sha256(phone),
            client_ip_address: req.ip,
            client_user_agent: req.headers['user-agent'],
            fbc: req.body.fbc || '',
            fbp: req.body.fbp || '',
            country: 'IE',
            city: '',
            zip: eircode || ''
          },
          custom_data: {
            service_type: service,
            is_airbnb: airbnb === 'Sim',
            service_value: value || ''
          }
        }
      ]
    };

    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    const response = await axios.post(url, payload);

    console.log('Evento enviado com sucesso:', response.data);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[ERRO] Falha ao enviar:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erro ao enviar evento para o Facebook.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
