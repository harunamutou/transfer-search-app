// bot/index.js

const { Client, IntentsBitField, GatewayIntentBits, Partials } = require('discord.js');
const { Pool } = require('pg');
require('dotenv').config();

// Discord BOTクライアント作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// PostgreSQL接続
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// ===== DB自動初期化（Web APIと同じ） =====
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fares (
      id SERIAL PRIMARY KEY,
      from_station INT REFERENCES stations(id),
      to_station INT REFERENCES stations(id),
      fare INT NOT NULL,
      UNIQUE(from_station, to_station)
    );

    CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      from_station INT REFERENCES stations(id),
      to_station INT REFERENCES stations(id),
      via_station_ids INT[],
      UNIQUE(from_station, to_station, via_station_ids)
    );
  `);
  console.log("DB initialized (BOT)!");
}

// ===== コマンド処理 =====
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  try {
    // ===== 駅追加 =====
    if (command === '!addstation') {
      const name = args.join(' ');
      if (!name) return message.reply('駅名を入力してください');
      const result = await pool.query(
        'INSERT INTO stations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *',
        [name]
      );
      if (result.rows.length === 0) return message.reply('駅は既に存在します');
      message.reply(`駅を追加しました: ${result.rows[0].name}`);
    }

    // ===== 運賃追加 =====
    else if (command === '!addfare') {
      const [from_id, to_id, fare] = args.map(Number);
      if (!from_id || !to_id || !fare) return message.reply('from_id, to_id, fare を入力してください');
      const result = await pool.query(
        'INSERT INTO fares (from_station, to_station, fare) VALUES ($1, $2, $3) ON CONFLICT (from_station, to_station) DO NOTHING RETURNING *',
        [from_id, to_id, fare]
      );
      if (result.rows.length === 0) return message.reply('運賃は既に登録済みです');
      message.reply(`運賃を追加しました: ${from_id} → ${to_id} = ${fare}円`);
    }

    // ===== 経路追加 =====
    else if (command === '!addroute') {
      const from_id = Number(args.shift());
      const to_id = Number(args.shift());
      const via_ids = args.map(Number);
      if (!from_id || !to_id) return message.reply('from_id と to_id は必須です');
      const result = await pool.query(
        'INSERT INTO routes (from_station, to_station, via_station_ids) VALUES ($1, $2, $3) ON CONFLICT (from_station, to_station, via_station_ids) DO NOTHING RETURNING *',
        [from_id, to_id, via_ids]
      );
      if (result.rows.length === 0) return message.reply('経路は既に登録済みです');
      message.reply(`経路を追加しました: ${from_id} → ${to_id} via [${via_ids.join(', ')}]`);
    }

    // ===== 運賃検索 =====
    else if (command === '!fare') {
      const from_id = Number(args.shift());
      const to_id = Number(args.shift());
      const via_ids = args.map(Number);

      if (!from_id || !to_id) return message.reply('出発駅と到着駅を入力してください');

      let totalFare = 0;

      // 直接運賃
      const direct = await pool.query(
        'SELECT fare FROM fares WHERE from_station=$1 AND to_station=$2',
        [from_id, to_id]
      );
      if (direct.rows.length > 0) totalFare += direct.rows[0].fare;

      // 経由駅がある場合
      for (let i = 0; i < via_ids.length; i++) {
        const start = i === 0 ? from_id : via_ids[i - 1];
        const end = via_ids[i];
        const fareRes = await pool.query('SELECT fare FROM fares WHERE from_station=$1 AND to_station=$2', [start, end]);
        if (fareRes.rows.length === 0) return message.reply(`運賃が未登録です（${start} → ${end}）`);
        totalFare += fareRes.rows[0].fare;
      }

      // 最後の区間
      if (via_ids.length > 0) {
        const last = via_ids[via_ids.length - 1];
        const fareRes = await pool.query('SELECT fare FROM fares WHERE from_station=$1 AND to_station=$2', [last, to_id]);
        if (fareRes.rows.length === 0) return message.reply(`運賃が未登録です（${last} → ${to_id}）`);
        totalFare += fareRes.rows[0].fare;
      }

      message.reply(`運賃合計: ${totalFare}円`);
    }

  } catch (err) {
    console.error(err);
    message.reply('エラーが発生しました');
  }
});

// ===== BOT起動 =====
initDB().then(() => {
  client.login(process.env.DISCORD_BOT_TOKEN);
  console.log("BOT logged in!");
}).catch(err => {
  console.error("DB初期化エラー (BOT):", err);
});
