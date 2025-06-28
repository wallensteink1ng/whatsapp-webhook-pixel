const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

// Armazena sessionId temporariamente com fbc/fbp
const sessionCookies = new Map();
const processedEvents = new Set();

app.use(cors());
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

  let fbc = '';
  let fbp = '';

  const sessionMatch = message.match(/\u200C([A-Za-z0-9+/=]+)$/);
  if (sessionMatch) {
    const sessionEncoded = sessionMatch[1];
    try {
      const sessionId = Buffer.from(sessionEncoded, 'base64').toString('utf-8');
      console.log('🧩 [webhook] sessionId decodificado:', sessionId);

      const cookies = sessionCookies.get(sessionId);
      if (cookies) {
        fbc = cookies.fbc || '';
        fbp = cookies.fbp || '';
      } else {
        console.warn('⚠️ Nenhum cookie encontrado para este sessionId');
      }
    } catch (err) {
      console.warn('⚠️ Erro ao decodificar sessionId:', err);
    }
  } else {
    console.warn('⚠️ sessionId não encontrado na mensagem');
  }

  if (!fbc && !fbp) console.warn('⚠️ Nenhum cookie de rastreamento detectado (fbc/fbp).');

  const cleanPhone = phone.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');
  const hashedCountry = crypto.createHash('sha256').update('IE').digest('hex');

  const cookieHeader = req.headers.cookie || '';
  const externalIdMatch = cookieHeader.match(/external_id=([^;]+)/);
  const externalIdRaw = externalIdMatch ? externalIdMatch[1] : cleanPhone;
  const hashedExternalId = crypto.createHash('sha256').update(externalIdRaw).digest('hex');

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
    action_source: 'chat',
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
      console.l
