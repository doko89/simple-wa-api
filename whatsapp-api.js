const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer'); 

const app = express();
const port = 3000;

app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'client-session',
    dataPath: './session'
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  }
});

let webhookUrl = "";

// QR Code handler
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan QR di atas pakai WhatsApp!');
});

client.on('ready', () => {
  console.log('WhatsApp client siap!');
});

// Endpoint kirim pesan ke nomor
app.post('/send-message', (req, res) => {
  const { number, message } = req.body;
  const formattedNumber = number + "@c.us";
  
  client.sendMessage(formattedNumber, message)
    .then(response => {
      res.json({ status: 'sukses', response });
    })
    .catch(err => {
      res.status(500).json({ status: 'gagal', error: err });
    });
});

// Endpoint kirim pesan ke grup by groupId
app.post('/send-group-message', async (req, res) => {
  const { groupId, message } = req.body;

  if (!groupId || !message) {
    return res.status(400).json({ status: 'gagal', error: 'groupId dan message wajib diisi' });
  }

  const chatId = groupId.endsWith('@g.us') ? groupId : `${groupId}@g.us`;

  client.sendMessage(chatId, message)
    .then(response => {
      res.json({ status: 'sukses', response });
    })
    .catch(err => {
      res.status(500).json({ status: 'gagal', error: err.message });
    });
});

// Endpoint list semua grup
app.get('/groups', async (req, res) => {
  const chats = await client.getChats();
  const groups = chats
    .filter(chat => chat.isGroup)
    .map(group => ({
      name: group.name,
      id: group.id._serialized
    }));

  res.json({ status: 'sukses', total: groups.length, groups });
});

// Endpoint set webhook URL
app.post('/set-webhook', (req, res) => {
  webhookUrl = req.body.url;
  res.json({ status: 'sukses', webhookUrl });
});

// Event pesan masuk
client.on('message', async msg => {
  console.log(`Pesan masuk dari ${msg.from}: ${msg.body}`);

  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, {
        from: msg.from,
        body: msg.body,
        isGroup: msg.from.includes('@g.us')
      });
    } catch (err) {
      console.error('Gagal kirim ke webhook:', err.message);
    }
  }
});

client.initialize();

app.listen(port, () => {
  console.log(`API jalan di http://localhost:${port}`);
});
