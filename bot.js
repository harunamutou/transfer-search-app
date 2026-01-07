import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Botトークン
const TOKEN = "ここにDiscordBotトークン";
const SERVER_API_URL = "https://あなたのRenderURL"; // server.jsが動作しているURL

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  try {
    // 経路検索
    if (cmd === "/route") {
      const start = args[0];
      const end = args[1];
      const via = args.slice(2,5);
      const res = await fetch(`${SERVER_API_URL}/search`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({start, end, via})
      });
      const data = await res.json();
      await message.reply(`検索結果: ${JSON.stringify(data)}`);
    }

    // 路線追加
    else if (cmd === "/addline") {
      const line = args[0];
      const res = await fetch(`${SERVER_API_URL}/addline`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({line})
      });
      const data = await res.json();
      await message.reply(`路線追加: ${JSON.stringify(data)}`);
    }

    // 駅追加
    else if (cmd === "/addstation") {
      const [line, station, distance] = args;
      const res = await fetch(`${SERVER_API_URL}/addstation`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({line, station, distance: Number(distance)})
      });
      const data = await res.json();
      await message.reply(`駅追加: ${JSON.stringify(data)}`);
    }

    // データ再読み込み
    else if (cmd === "/reload") {
      const res = await fetch(`${SERVER_API_URL}/reload`, {method:"POST"});
      const data = await res.json();
      await message.reply(`データ再読み込み: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    await message.reply(`エラー: ${err.message}`);
  }
});

client.login(TOKEN);
