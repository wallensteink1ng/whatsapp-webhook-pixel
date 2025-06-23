// index.js - Webhook Meta Pixel atualizado para extrair fbc/fbp da mensagem

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 10000;

const processedEvents = new Set();

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

  const metaTag = '\u200C';
  if (!message.startsWith(metaTag)) {
    console.log('⛔ Ignorado: mensagem não veio de campanha Meta');
    return res.status(200).send('Mensagem fora do Meta ignorada');
  }

  const eventId = `${messageId}_${phone}`;
  if (processedEvents.has(eventId)) {
    console.log('⏩ Evento duplicado ignorado');
    return res.status(200).send('Evento duplicado');
  }
  processedEvents.add(eventId);

  // Extrai fbc/fbp da própria mensagem, caso estejam colados no final
  let fbcFromText = '';
  let fbpFromText = '';
  try {
    const queryMatch = message.match(/&fbc=([^&\s]+)/);
    const queryMatch2 = message.match(/&fbp=([^&\s]+)/);
    if (queryMatch) fbcFromText = decodeURIComponent(queryMatch[1]);
    if (queryMatch2) fbpFromText = decodeURIComponent(queryMatch2[1]);
  } catch (e) {
    console.warn('⚠️ Erro ao extrair fbc/fbp da mensagem:', e);
  }

  const fbc = data?.fbc || fbcFromText;
  const fbp = data?.fbp || fbpFromText;

  if (!fbc && !fbp) {
    console.warn('⚠️ Nenhum cookie de rastreamento detectado (fbc/fbp).');
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');
  const hashedCountry = crypto.createHash('sha256').update('IE').digest('hex');
  const hashedExternalId = crypto.createHash('sha256').update(cleanPhone).digest('hex');

  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || '1.1.1.1';
  const userAgent = req.headers['user-agent'] || 'WhatsApp-Business-API';
  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date.now() / 1000);

  console.log('🧪 Dados para correspondência:', { fbc, fbp, userIp, userAgent });

  const pixelID = '1894086348055772';
  const accessToken = 'EAAOqjZBgr90YBO9CC5T4gthsK0dyYYecZB0nv890ZCN99hjAF9q9pUTNDTsaYCYuEZC7ulCGLY93lo8f2MLpUskZBpQXEgGABGsKPFflNeWL63SlHEfsdF40qhoC0ExRhfdLbXxYt0vgmszAZBT8hJ7A0qGDeIPCckXotO4UAhD1gvl512Gd7gb7dC554K6gYiEgZDZD';

  const event = {
    event_name: 'MessageSent',
    event_time: eventTime,
    event_source_url: req.headers['referer'] || 'https://barbaracleaning.com',
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
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${pixelID}/events?access_token=${accessToken}`,
      { data: [event] }
    );

    if (response?.data?.events_received === 0) {
      console.warn('⚠️ Facebook aceitou requisição mas não registrou evento.');
    } else {
      console.log('✅ Evento registrado com sucesso:', response.data);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar pro Pixel:', error.response?.data || error.message);
  }

  res.status(200).send('Evento recebido');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
