const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'invited',
    description: 'Show who invited a user',

    async execute(message, args) {
        // Prefer args[0] (slash/user-id) then mentions, then fallback to author
        let target = null;
        if (args && args[0]) {
            target = await message.client.users.fetch(args[0]).catch(() => null);
        }
        if (!target) {
            try {
                if (message.mentions && message.mentions.users && typeof message.mentions.users.first === 'function') {
                    target = message.mentions.users.first();
                }
            } catch (e) { target = null; }
        }
        if (!target) target = message.author;

        const inviterId = message.client.inviterMap.get(target.id);
        const inviter = inviterId ? await message.client.users.fetch(inviterId).catch(() => null) : null;

        const embed = new MessageEmbed()
            .setColor('000000')
            .setTitle('Invited By')
            .setDescription(`${target.tag} (${target}) was invited by ${inviter ? `${inviter.tag} (${inviter})` : 'Unknown'}`)
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};
