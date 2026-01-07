require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// コマンド読み込み
const commandsPath = path.join(__dirname, 'commands');
fs.readdirSync(commandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(`./commands/${file}`);
        client.commands.set(command.data.name, command);
    }
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// コマンド処理
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'E999: コマンド実行中にエラーが発生しました', ephemeral: true });
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
