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

  // Agora verificando se a mensagem começa com \u200C
  if (!message.startsWith('\u200C')) {
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

  const eventTime = momment ? Math.floor(Number(momment) / 1000) : Math.floor(Date
