// index.js - Webhook completo com decodificação invisível e lookup de cookies

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

const sessionStore = new Map(); // Armazena sessionId -> cookies

// Decodifica invisível (\u200B e \u200C) para texto real
function decodeInvisible(text) {
  const binary = [...text].map(c => {
    if (c === '\u200B') return '0';
    if (c === '\u200C') return '1';
    return ''; // ignora outros
  }).join('');

  const chars = binary.match(/.{8}/g) || [];
  return chars.map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
}

// Endpoint opcional para salvar fbc/fbp manualmente
app.post('/pretrack', (req, res) => {
  const { sessionId, fbc, fbp } = req.body;
  if (!sessionId) return res.status(400).send('Missing sessionId');
  sessionStore.set(sessionId, { fbc, fbp });
  console.log('💾 [pretrack] sessionId salvo:', sessionId);
  res.status(200).send('ok');
});

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
    return res.status(200).send('Ignorado');
  }

  // Verifica se veio de campanha Meta
  if (!message.startsWith('\u200C')) {
    console.log('⛔ Ignorado: mensagem sem tag invisível inicial');
    return res.status(200).send('Fora da campanha');
  }

  // Tenta extrair sessionId invisível
  const sidDecoded = decodeInvisible(message);
  console.log('🧩 [webhook] sessionId decodificado:', sidDecoded);

  // Busca cookies associados ao sessionId
  const sessionCookies = sessionStore.get(sidDecoded) || {};
  const fbc = sessionCookies.fbc || '';
  const fbp = sessionCookies.fbp || '';

  if (!fbc && !fbp) console.warn('⚠️ Nenhum cookie de rastreamento detectado (fbc/fbp).');

  // Prepara dados
  const cleanPhone = phone.replace(/\D/g, '');
  const hashedPhone = crypto.createHash('sha256').update(cleanPhone).digest('hex');
  const hashedCountry = crypto.createHash('sha256').update('IE').digest('hex');
  const hashedExternalId = crypto.createHash('sha256').update(cleanPhone).digest('hex');
  const userIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '1.1.1.1';
  const userAgent = req.headers['user-agent'] || 'WhatsApp-Business-API';
  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date.now() / 1000);
  const eventId = `${messageId}_${phone}`;

  console.log('🧪 Dados para correspondência:', { fbc, fbp, userIp, userAgent });

  const pixelID = '1894086348055772';
  const accessToken = 'EAAOqjZBgr90YBO9CC5T4gthsK0dyYYecZB0nv890ZCN99hjAF9q9pUTNDTsaYCYuEZC7ulCGLY93lo8f2MLpUskZBpQXEgGABGsKPFflNeWL63SlHEfsdF40qhoC0ExRhfdLbXxYt0vgmszAZBT8hJ7A0qGDeIPCckXotO4UAhD1gvl512Gd7gb7dC554K6gYiEgZDZD';

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
      fbc,
      fbp
    },
    custom_data: {
      message,
      phone,
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
    console.log('✅ Evento registrado com sucesso:', response.data);
  } catch (err) {
    console.error('❌ Erro ao enviar evento:', err.response?.data || err.message);
  }

  res.status(200).send('ok');
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
