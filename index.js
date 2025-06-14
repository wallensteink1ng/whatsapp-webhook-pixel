const express = require('express');
const app = express();
const axios = require('axios');

// Middleware para aceitar JSON
app.use(express.json());

// Permitir CORS (acesso externo)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Teste simples com log
app.post('/webhook', async (req, res) => {
  console.log('✅ Webhook recebeu algo:');
  console.log(JSON.stringify(req.body, null, 2));

  // Se tiver message e sender, simula envio pro pixel
  if (req.body.message && req.body.sender) {
    console.log(`📤 Simulando envio para o pixel com: ${req.body.message}`);
  }

  res.status(200).send('Webhook recebeu com sucesso');
});

// Porta padrão Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
