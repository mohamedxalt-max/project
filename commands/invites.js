const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'invites',
    description: 'Show how many invites a user has',

    async execute(message, args) {
        // Prefer args[0] (user id) then mentions, then fallback to author
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

        const guild = message.guild;
        if (!guild) return message.channel.send('This command can only be used in a guild.');

        try {
            const invites = await guild.invites.fetch();
            let count = 0;
            invites.forEach(inv => {
                if (inv.inviter && inv.inviter.id === target.id) count += inv.uses;
            });

            const embed = new MessageEmbed()
                .setColor('000000')
                .setTitle('Invite Count')
                .setDescription(`${target.tag} (${target}) has ${count} invite(s).`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            return message.channel.send('Failed to fetch invites: ' + err.message);
        }
    }
};
