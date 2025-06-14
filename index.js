
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const PIXEL_ID = "595219590269152";
const ACCESS_TOKEN = "EAAOqjZBgr90YBOy5mshB7p9wWZAH15ZBp3jOu8jZADZCT7dscUfKhPe80IJhwKuZCTsachvxv3B6dZBaNSu2HTq77ky6s8Bz0my28oYX59aMhHfeQX3cRBg49UrARoIPjWGGdEyMrCnzeg9CrdPXFKdvHqkHGOxrguiASiIj7p0Mjtz8P8Dd5jgYusw5WVkz4ZBWIwZDZD";
const EVENT_NAME = "WhatsAppMessageSent";

app.post('/webhook', async (req, res) => {
  const message = req.body;

  if (message && message.body && message.body.message) {
    console.log('Mensagem recebida:', message.body.message);

    try {
      await axios.post(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
        data: [{
          event_name: EVENT_NAME,
          event_time: Math.floor(Date.now() / 1000),
          user_data: {
            external_id: "user_" + message.body.sender
          },
          custom_data: {
            message: message.body.message
          }
        }]
      });
      console.log('Evento enviado para o Facebook com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar evento para o Facebook:', error.response ? error.response.data : error.message);
    }

    return res.sendStatus(200);
  }

  res.sendStatus(400);
});

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
