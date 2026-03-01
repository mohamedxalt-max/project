const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'test',
    description: 'Test welcome embed styling',

    async execute(message, args, client, log, config) {
        // Create a test welcome embed
        const testEmbed = new MessageEmbed()
            .setColor(config.color && config.color.default ? config.color.default : '#5865F2')
            .setTitle('🎉 Welcome to VenHub')
            .setDescription(`━━━━━━━━━━━━━━━━━━━━━\nHello ${message.author}, welcome to our community!\n━━━━━━━━━━━━━━━━━━━━━`)
                .addFields(
                    { name: '👤 Member Info', value:
                        `▶ Username: **${message.author.tag}**\n` +
                        `▶ Member Count: **#${message.guild.memberCount}**\n` +
                        `▶ Joined: <t:${Math.floor(message.member.joinedTimestamp / 1000)}:R>`, inline: false },
                    { name: '🎯 Your Inviter', value:
                        `▶ Invited by: **Unknown** (test mode)\n` +
                        `▶ Their Invites: **0**\n` +
                        `▶ Thank them for the invite!`, inline: false },
                    { name: '📋 Quick Links', value:
                        `▶ Read <#${message.guild.channels.cache.find(c => c.name.includes('rules'))?.id || '0'}> \n` +
                        `▶ Check <#${message.guild.channels.cache.find(c => c.name.includes('intro'))?.id || '0'}>\n` +
                        `▶ Explore the server!`, inline: false }
                )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
                .setFooter({ text: `ID: ${message.author.id}` })
            .setTimestamp();

        try {
            await message.channel.send({ embeds: [testEmbed] });
            log.info(`Test welcome embed sent by ${message.author.tag}`);
        } catch (err) {
            log.error('Failed to send test embed:', err.message);
            await message.channel.send('Failed to send test embed.');
        }
    }
};
