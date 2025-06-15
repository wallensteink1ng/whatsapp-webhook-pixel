const express = require('express');
const axios = require('axios');
const crypto = require('crypto'); // ← IMPORTANTE
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.post('/webhook', async (req, res) => {
  console.log('📩 Webhook recebeu algo:');
  console.log(req.body);

  const data = req.body;
  const message = data?.text?.message;
  const sender = data?.phone;

  if (!message || !sender) {
    console.log('⚠️ Mensagem ou número não detectado');
    return res.status(200).send('Sem dados relevantes');
  }

  // ⚠️ HASH do número de telefone
  const cleanPhone = sender.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');

  const pixelID = '595219590269152';
  const accessToken = 'EAAOqjZBgr90YBOy5mshB7p9wWZAH15ZBp3jOu8jZADZCT7dscUfKhPe80IJhwKuZCTsachvxv3B6dZBaNSu2HTq77ky6s8Bz0my28oYX59aMhHfeQX3cRBg49UrARoIPjWGGdEyMrCnzeg9CrdPXFKdvHqkHGOxrguiASiIj7p0Mjtz8P8Dd5jgYusw5WVkz4ZBWIwZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      ph: hashedPhone
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
      { data: [event] }
    );
    console.log('✅ Evento enviado com sucesso:', response.data);
  } catch (err) {
    console.error('❌ Erro ao enviar para o Pixel:', err.response?.data || err.message);
  }

  res.status(200).send('Recebido com sucesso');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
