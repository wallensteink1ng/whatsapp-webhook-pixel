const express = require('express');
const app = express();
const axios = require('axios');

app.use(express.json());

// Permitir CORS
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Configurações do Pixel
const PIXEL_ID = '595219590269152';
const ACCESS_TOKEN = 'EAAOqjZBgr90YBOy5mshB7p9wWZAH15ZBp3jOu8jZADZCT7dscUfKhPe80IJhwKuZCTsachvxv3B6dZBaNSu2HTq77ky6s8Bz0my28oYX59aMhHfeQX3cRBg49UrARoIPjWGGdEyMrCnzeg9CrdPXFKdvHqkHGOxrguiASiIj7p0Mjtz8P8Dd5jgYusw5WVkz4ZBWIwZDZD';

app.post('/webhook', async (req, res) => {
  const { message, sender } = req.body;

  console.log('✅ Webhook recebeu algo:');
  console.log(req.body);

  if (message && sender) {
    console.log(`📤 Enviando pro Pixel: ${message}`);

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        {
          data: [
            {
              event_name: 'MessageSent',
              event_time: Math.floor(Date.now() / 1000),
              event_source_url: 'https://barbaracleaning.ie', // troque se tiver outro domínio
              user_data: {
                client_ip_address: req.ip,
                client_user_agent: req.headers['user-agent']
              },
              custom_data: {
                content_name: 'WhatsApp Message',
                message,
                sender
              },
              action_source: 'website'
            }
          ]
        }
      );
      console.log('✅ Evento enviado com sucesso:', response.data);
    } catch (err) {
      console.error('❌ Erro ao enviar pro Pixel:', err.response?.data || err.message);
    }
  } else {
    console.log('⚠️ Mensagem ou número não detectado');
  }

  res.status(200).send('Webhook recebeu com sucesso');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
