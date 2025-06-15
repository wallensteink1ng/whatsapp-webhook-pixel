const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// ROTA DO WEBHOOK
app.post('/webhook', async (req, res) => {
  console.log('📩 Recebido:', req.body); // Log completo da requisição

  const data = req.body;
  const message = data.message;
  const sender = data.sender;

  if (!message || !sender) {
    console.log('⚠️ Mensagem ou número não detectado');
    return res.status(200).send('Recebido sem dados relevantes');
  }

  // Enviar para o Pixel
  const pixelID = '595219590269152';
  const accessToken = 'EAAOqjZBgr90YBOy5mshB7p9wWZAH15ZBp3jOu8jZADZCT7dscUfKhPe80IJhwKuZCTsachvxv3B6dZBaNSu2HTq77ky6s8Bz0my28oYX59aMhHfeQX3cRBg49UrARoIPjWGGdEyMrCnzeg9CrdPXFKdvHqkHGOxrguiASiIj7p0Mjtz8P8Dd5jgYusw5WVkz4ZBWIwZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      ph: sender.replace(/\D/g, '') // remove símbolos do número
    },
    custom_data: {
      content_name: message
    },
    action_source: 'chat'
  };

  try {
    console.log('📤 Enviando pro Pixel:', message);
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pixelID}/events?access_token=${accessToken}`,
      {
        data: [event]
      }
    );
    console.log('✅ Evento enviado com sucesso:', response.data);
  } catch (error) {
    console.error('❌ Erro ao enviar para o Pixel:', error.response?.data || error.message);
  }

  res.status(200).send('Evento recebido');
});

// INICIALIZA SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
