const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

app.post('/webhook', async (req, res) => {
  const data = req.body;
  console.log('📩 Webhook recebeu algo:\n', data);

  const message = data?.text?.message;
  const phone = data?.phone;
  const senderName = data?.senderName || '';
  const chatName = data?.chatName || '';
  const messageId = data?.messageId || '';
  const momment = data?.momment;

  if (!message || !phone) {
    console.log('⚠️ Mensagem ou número não detectado');
    return res.status(200).send('Recebido sem dados relevantes');
  }

  // Hashear o telefone no padrão do Meta (SHA256)
  const hashedPhone = crypto
    .createHash('sha256')
    .update(phone.replace(/\D/g, ''))
    .digest('hex');

  // Use o timestamp real se enviado pela Z-API, senão usa o atual
  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date.now() / 1000);

  const pixelID = '595219590269152';
  const accessToken = 'EAAOqjZBgr90YBOy5mshB7p9wWZAH15ZBp3jOu8jZADZCT7dscUfKhPe80IJhwKuZCTsachvxv3B6dZBaNSu2HTq77ky6s8Bz0my28oYX59aMhHfeQX3cRBg49UrARoIPjWGGdEyMrCnzeg9CrdPXFKdvHqkHGOxrguiASiIj7p0Mjtz8P8Dd5jgYusw5WVkz4ZBWIwZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: eventTime,
    action_source: 'system_generated',
    user_data: {
      ph: hashedPhone
    },
    custom_data: {
      phone: phone,
      sender_name: senderName,
      chat_name: chatName,
      message_id: messageId,
      message: message
    }
  };

  try {
    console.log('📤 Enviando pro Pixel:', message);
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pixelID}/events?access_token=${accessToken}`,
      {
        data: [event],
        test_event_code: 'TEST70263' // ← ESSA LINHA FAZ APARECER NO TEST EVENTS
      }
    );
    console.log('✅ Evento enviado com sucesso:', response.data);
  } catch (error) {
    console.error('❌ Erro ao enviar para o Pixel:', error.response?.data || error.message);
  }

  res.status(200).send('Evento recebido');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
