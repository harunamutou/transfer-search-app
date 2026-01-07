const { SlashCommandBuilder } = require('discord.js');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add_station')
        .setDescription('駅を追加する')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('駅名')
            .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        if (!name) return interaction.reply({ content: 'E001: 駅名が空です', ephemeral: true });

        try {
            const res = await pool.query('INSERT INTO stations(name) VALUES($1) RETURNING id', [name]);
            await interaction.reply(`駅 "${name}" を追加しました (ID: ${res.rows[0].id})`);
        } catch (err) {
            if (err.code === '23505') { // UNIQUE制約違反
                return interaction.reply({ content: 'E002: すでに同名駅が存在します', ephemeral: true });
            }
            console.error(err);
            return interaction.reply({ content: 'E999: 不明なエラー', ephemeral: true });
        }
    }
};
