const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'updates',
    description: 'Show all recent bot updates and fixes',

    async execute(message, args, client, log, config) {
        // Build the updates embed with styled headers
        const embed = new MessageEmbed()
            .setColor('#2f3136')
            .setTitle('🚀 VenHub Support Bot - Latest Updates')
            .setDescription('All fixes and improvements implemented in the latest version')
            .setThumbnail(config.logo || 'https://cdn.discordapp.com/embed/avatars/0.png');

        // Core Upgrades
        // Core Upgrades and other sections using addFields for future compatibility
        embed.addFields(
            { name: '</> Core Upgrades', value:
                '▶ Discord.js v12 → v13 (latest stable)\n' +
                '▶ Full interaction component support\n' +
                '▶ Intents system integration\n' +
                '▶ Modern slash command API', inline: false },
            { name: '🎫 Ticket System Enhancements', value:
                '▶ Button components (Close Ticket button)\n' +
                '▶ Confirmation prompt (type "confirm" to close)\n' +
                '▶ Automatic transcript logging\n' +
                '▶ Transcripts saved to `logs/tickets/`\n' +
                '▶ Optional log channel posting\n' +
                '▶ Styled embed creation/closing messages', inline: false },
            { name: '█ Stability & Error Handling', value:
                '▶ Hardened interaction response fallbacks\n' +
                '▶ Graceful channel availability checks\n' +
                '▶ Improved error logging & recovery\n' +
                '▶ Prevented "Unknown Channel" errors', inline: false },
            { name: '⚙️ API & Compatibility Fixes', value:
                '▶ Replaced `guild.fetchInvites()` → `guild.invites.fetch()`\n' +
                '▶ Updated deprecated `message` → `messageCreate` event\n' +
                '▶ Fixed MessageEmbed deprecation warnings\n' +
                '▶ v13 compatible footer & field methods', inline: false },
            { name: '</> Commands Fixed', value:
                '▶ `/promote` now accepts user option\n' +
                '▶ `/welcomeset` now accepts channel option\n' +
                '▶ Slash command option handling\n' +
                '▶ Backwards compatible with mentions', inline: false },
            { name: '🌐 Web & Verification', value:
                '▶ Terms & Privacy page served via Express\n' +
                '▶ Redirect to external hosting (Bolt.host)\n' +
                '▶ Static file serving enabled\n' +
                '▶ Discord bot verification support', inline: false },
            { name: '░ General Improvements', value:
                '▶ Bot runs 24/7 when configured\n' +
                '▶ Clean command registration\n' +
                '▶ Enhanced logging with CatLoggr\n' +
                '▶ Organized command structure', inline: false }
        );
        embed.setFooter({ text: 'VenHub Support Bot | All Systems Operational', iconURL: config.logo || '' });
        embed.setTimestamp();

        // Send the embed
        try {
            await message.channel.send({ embeds: [embed] });
            log.info(`Updates announced by ${message.author.tag}`);
        } catch (err) {
            log.error('Failed to send updates:', err.message);
            await message.channel.send('Failed to send updates embed.');
        }
    }
};
