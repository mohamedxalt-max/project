// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const config = require('../config.json');

module.exports = {
        name: 'help', // Command name
        description: 'Display the command list.', // Command description

    /**
     * Command execute
     * @param {Message} message The message sent by user
     */
        execute(message) {
                const { commands } = message.client; // Get commands from the client

        // build the base embed using the shared makeEmbed helper if available
        let embed;
        if (typeof message.client.makeEmbed === 'function') {
            embed = message.client.makeEmbed();
        } else {
            // default black if not set
            embed = new MessageEmbed().setColor(config.color && config.color.default ? config.color.default : '#000000');
        }

        // title/description override from config (add markdown styling)
        const rawTitle = config.helpTitle || 'Command list';
        embed.setTitle(`# ${rawTitle}`);
        // optional logo thumbnail (appears on right side of description)
        if (config.logo) {
            embed.setThumbnail(config.logo);
        }

        if (config.helpDescription) {
            // prefix each line of description with small-heading markdown
            const lines = config.helpDescription.split('\n');
            embed.setDescription(lines.map(l => `### ${l}`).join('\n'));
        } else {
            embed.setDescription(commands.map(c => `**\`${config.prefix}${c.name}\`**: ${c.description ? c.description : '*No description provided*'}`).join('\n'));
        }

        // optional extra fields
        if (Array.isArray(config.helpFields)) {
            config.helpFields.forEach(f => {
                if (f && f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: f.inline || false });
            });
        }

        // footer and image
        embed.setFooter(config.helpFooter || message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }));
        // banner removed to avoid media gallery
        embed.setTimestamp();

        message.channel.send(embed);
        }
};
