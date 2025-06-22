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

  const metaTag = '\u200C'; // marcador invisível
  if (!message.startsWith(metaTag)) {
    console.log('⛔ Ignorado: mensagem não veio de campanha Meta');
    return res.status(200).send('Mensagem fora do Meta ignorada');
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');
  const hashedCountry = crypto.createHash('sha256').update('IE').digest('hex');
  const hashedExternalId = crypto.createHash('sha256').update(cleanPhone).digest('hex');

  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || '1.1.1.1';
  const userAgent = req.headers['user-agent'] || 'WhatsApp-Business-API';

  // Captura dos identificadores do Meta (se forem enviados via frontend)
  const fbc = req.body?.fbc || '';
  const fbp = req.body?.fbp || '';

  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date.now() / 1000);
  const eventId = `${messageId}_${phone}`;

  const pixelID = '1894086348055772';
  const accessToken = 'EAAOqjZBgr90YBOxXKae3ZCLuNVnHeZCnrBs6ZAucRAJweq6xzulUX9Cb0nLouYWKBB5pNLz7ZAEBa1sbxiwmOcILcnh1vyud3no4hWuYbFobafl5AhVp2R5uIkR3t7YT8x21swZCIcBbL6lutX9ZCD6moLtXYJ8jTmGPp52wF5ZBGinDQrcoc00dKd8JZAMHe2UjhkwZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: eventTime,
    event_source_url: 'https://barbaracleaning.com',
    action_source: 'system_generated',
    event_id: eventId,
    user_data: {
      ph: hashedPhone,
      country: hashedCountry,
      external_id: hashedExternalId,
      client_ip_address: userIp,
      client_user_agent: userAgent,
      fbc: fbc,
      fbp: fbp
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
      { data: [event] }
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
