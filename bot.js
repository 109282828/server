const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const axios = require('axios'); // npm install axios

const BOT_TOKEN = '9001719911:AAFr3K_Kc6OXGvzuRzjTWJe76U98pYEPS98';
const ADMIN_ID = 9256345316;
const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

// ВСТАВЬ ССЫЛКУ НА АРХИВ ИЗ GITHUB ACTIONS
const GITHUB_ARTIFACT_URL = 'ССЫЛКА_СЮДА';

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

bot.action('gen_android', async (ctx) => {
  await ctx.reply('⏳ Скачиваю свежий APK с Гитхаба...');
  try {
    // Скачиваем архив из Actions
    const res = await axios.get(GITHUB_ARTIFACT_URL, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);
    
    // Отправляем прямо в чат (как zip-архив из Actions)
    await ctx.replyWithDocument({ source: buffer, filename: 'Nerogram-Debug.zip' }, {
      caption: 'Скачай, распакуй и установи app-debug.apk'
    });
  } catch (e) {
    ctx.reply('❌ Ошибка скачивания APK с GitHub: ' + e.message);
  }
});

// ... ОСТАЛЬНОЙ КОД (devs, checkin, data) ОСТАВЛЯЕШЬ КАК БЫЛО ...
