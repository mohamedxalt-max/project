const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
    name: 'ticketpanel',
    description: 'Send ticket creation panel to yourself only',

    async execute(message, args, client, log, config) {
        // Create the ticket panel embed
        const ticketPanelEmbed = new MessageEmbed()
            .setColor('#2f3136')
            .setTitle('🎫 Support Ticket System')
            .setDescription('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nNeed help? Create a support ticket below!\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            .addFields(
                { name: '📋 How It Works', value:
                    '▶ Click the button below to create a ticket\n' +
                    '▶ A private channel will be created for you\n' +
                    '▶ Explain your issue to our support team\n' +
                    '▶ We\'ll help you resolve it ASAP', inline: false },
                { name: '⏱️ Response Time', value:
                    '▶ Average response: **< 5 minutes**\n' +
                    '▶ Open 24/7 for all members\n' +
                    '▶ Professional support team', inline: false },
                { name: '🔒 Privacy', value:
                    '▶ Your ticket is private\n' +
                    '▶ Only you and staff can see it\n' +
                    '▶ Confidentiality guaranteed', inline: false }
            )
            .setThumbnail(config.logo || 'https://cdn.discordapp.com/embed/avatars/0.png')
            .setFooter({ text: 'VenHub Support System', iconURL: config.logo || '' })
            .setTimestamp();

        // Create the button row
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('ticket_create_btn')
                    .setLabel('Create Ticket')
                    .setStyle('PRIMARY')
                    .setEmoji('🎫')
            );

        try {
            // Send as ephemeral reply (only visible to the user who ran the command)
            await message.channel.send({ embeds: [ticketPanelEmbed], components: [row] });
            log.info(`Ticket panel sent to ${message.author.tag}`);
        } catch (err) {
            log.error('Failed to send ticket panel:', err.message);
            await message.channel.send({ content: 'Failed to send ticket panel.' });
        }
    }
};
