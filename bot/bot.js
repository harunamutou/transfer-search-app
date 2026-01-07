import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const SERVER_URL = process.env.SERVER_URL;
const TOKEN = process.env.DISCORD_TOKEN;

client.on("ready", ()=>console.log(`Logged in as ${client.user.tag}`));

client.on("messageCreate", async (msg)=>{
  if(msg.content.startsWith("!addStation")){
    const parts = msg.content.split(" ");
    if(parts.length<4) return msg.reply("使い方: !addStation 路線 駅名 距離");
    const [_, line, station, distance] = parts;
    try{
      const res = await fetch(`${SERVER_URL}/addStationDiscord`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({line,station,distance,token:TOKEN})
      });
      const data = await res.json();
      msg.reply(`追加結果: ${JSON.stringify(data)}`);
    }catch(e){
      msg.reply(`エラー: ${e.message}`);
    }
  }
});

client.login(process.env.BOT_TOKEN);
