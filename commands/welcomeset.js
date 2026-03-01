const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'welcomeset',
    description: 'Set the welcome channel',

    async execute(message, args, client, log, config) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send('❌ Admin only!');
        }

        // Try args first (slash command option), then fall back to mentions
        let channel = null;
        if (args[0]) {
            channel = message.guild.channels.cache.get(args[0]) || message.guild.channels.cache.find(c => c.name === args[0]);
        }
        if (!channel) {
            try {
                if (message.mentions && message.mentions.channels && typeof message.mentions.channels.first === 'function') {
                    channel = message.mentions.channels.first();
                }
            } catch (e) { channel = null; }
        }
        if (!channel) {
            return message.channel.send('❌ Please mention a channel or provide a channel ID!');
        }

        // Save welcome channel to config
        const configPath = './config.json';
        let configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        configData.welcomeChannel = channel.id;
        fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

        message.channel.send(`✅ Welcome channel set to ${channel}`);
        log.info(`Welcome channel set to ${channel.id}`);
    }
};
