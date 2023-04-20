const dotenv = require('dotenv');
dotenv.config();

const config = {
  discord_token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
};

module.exports = config;