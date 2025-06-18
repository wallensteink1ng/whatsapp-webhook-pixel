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
  const messageId = data?.messageId || '';
  const momment = data?.momment;
  const senderName = data?.senderName || '';
  const chatName = data?.chatName || '';

  if (!message || !phone) {
    console.log('⚠️ Mensagem ou número não detectado');
    return res.status(200).send('Recebido sem dados relevantes');
  }

  const messageLower = message.toLowerCase();
  if (!messageLower.includes('🔵')) {
    console.log('⛔ Ignorado: mensagem não veio de campanha Meta');
    return res.status(200).send('Mensagem fora do Meta ignorada');
  }

  const hashedPhone = crypto
    .createHash('sha256')
    .update(phone.replace(/\D/g, ''))
    .digest('hex');

  const hashedCountry = crypto
    .createHash('sha256')
    .update('IE')
    .digest('hex');

  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date.now() / 1000);
  const eventId = `${messageId}_${phone}`;

  const pixelID = '1894086348055772';
  const accessToken = 'EAAOqjZBgr90YBOzuHxXHoD7oQXEi93D9gnWh5BJOWUPX8fbo9yWfDViHxFV2unxPaU9JYPZA7ZA5O8FVQHZCcgtT9FKK4NP1ZBJG57SvaYmskISLtv9vnTRUbVtXShoHXzRwUw5wjZCFWWSn5ZBdtfyOrqrX9GqfweBNALZCkTt8LbHtPbA4y752ugMDKLEnRp0SxwZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: eventTime,
    event_source_url: 'https://barbaracleaning.ie',
    action_source: 'system_generated',
    event_id: eventId,
    user_data: {
      ph: hashedPhone,
      country: hashedCountry,
      client_ip_address: '1.1.1.1',
      client_user_agent: 'WhatsApp-Business-API'
    },
    custom_data: {
      message: message,
      phone: phone,
      sender_name: senderName,
      chat_name: chatName,
      message_id: messageId,
      cidade: 'Dublin',
      regiao: 'Leinster'
    }
  };

  try {
    console.log('📤 Enviando pro Pixel:', message);
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pixelID}/events?access_token=${accessToken}`,
      {
        data: [event]
      }
    );
    console.log('✅ Evento enviado com sucesso:', response.data);
  } catch (error) {
    console.error('❌ Erro ao enviar pro Pixel:', error.response?.data || error.message);
  }

  res.status(200).send('Evento recebido');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
