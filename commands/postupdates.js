// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'postupdates',
    description: 'Post the latest bot updates to a specific channel.',

    async execute(message) {
        // Delete the command message
        message.delete().catch(() => {});

        const targetChannelId = '1462093551369322506';
        const targetChannel = message.client.channels.cache.get(targetChannelId);

        if (!targetChannel) {
            return message.author.send(`❌ Could not find channel with ID: ${targetChannelId}`).catch(() => {});
        }

        const embed = new MessageEmbed()
            .setColor(config.color.default)
            .setAuthor({ name: 'xM3Dx Bot Updates', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('🚀 Major Bot Upgrade Released!')
            .setDescription('We have just pushed a massive update to the system! Here is everything new:')
            .addFields(
                { name: '✨ Slash Commands', value: 'The bot now supports `/` commands! Type `/gen` to start generating with a sleek new interface.', inline: false },
                { name: '📂 Service Picker', value: 'No more manual typing! You can now pick your service (Spotify, Minecraft, etc.) from a list.', inline: false },
                { name: '🎭 Auto-Role System', value: `Gain access instantly by adding our vanity to your status:\n\`\`\`${config.vanity}\`\`\``, inline: false },
                { name: '🛡️ Enhanced Security', value: 'Added a 5-minute cooldown and a temporary mute system to ensure fair use for everyone.', inline: false },
                { name: '🔗 Vouch Integration', value: `Direct links to <#${config.vouchChannel}> now included in DMs after every successful generation.`, inline: false },
                { name: '🖼️ Aesthetic UI', value: 'Complete redesign of all direct messages and bot responses for a professional feel.', inline: false }
            )
            
            .setFooter('Thank you for being part of xM3Dx Community!')
            .setTimestamp();

        try {
            await targetChannel.send('@everyone @here', embed);
            message.author.send(`✅ Successfully posted updates to <#${targetChannelId}>`).catch(() => {});
        } catch (error) {
            console.error(error);
            message.author.send(`❌ Failed to post updates: ${error.message}`).catch(() => {});
        }
    }
};