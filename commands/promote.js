const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'promote',
    description: 'Give the Staff role to a member (requires manage roles permission)',

    async execute(message, args) {
        // only allow in guild
        if (!message.guild) return message.channel.send('This command only works in a server.');

        // permission check
        if (!message.member.permissions.has('MANAGE_ROLES')) {
            return message.channel.send('You need the Manage Roles permission to use this.');
        }

        // Try args first (slash command option), then fall back to mentions
        let target = null;
        if (args[0]) {
            // args[0] may be an ID
            target = await message.guild.members.fetch(args[0]).catch(() => null);
        }
        if (!target) {
            // robust mention handling: support message.mentions.members or message.mentions.users
            try {
                if (message.mentions && message.mentions.members && typeof message.mentions.members.first === 'function') {
                    target = message.mentions.members.first();
                } else if (message.mentions && message.mentions.users && typeof message.mentions.users.first === 'function') {
                    const u = message.mentions.users.first();
                    if (u) target = await message.guild.members.fetch(u.id).catch(() => null);
                }
            } catch (e) { target = null; }
        }
        if (!target) {
            return message.channel.send('Please mention a user or provide their ID.');
        }

        // look up staff role from config or fallback to name
        let staffRole = null;
        if (config.staffRole) staffRole = message.guild.roles.cache.get(config.staffRole);
        if (!staffRole) staffRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
        if (!staffRole) {
            return message.channel.send('Could not find a "Staff" role. Please create one or add `staffRole` to config.');
        }

        try {
            await target.roles.add(staffRole);
            const embed = new MessageEmbed()
                .setColor(config.color.green || '0x57F287')
                .setTitle('Promoted!')
                .setDescription(`${target} has been given the **${staffRole.name}** role.`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            return message.channel.send('Failed to add role: ' + err.message);
        }
    }
};