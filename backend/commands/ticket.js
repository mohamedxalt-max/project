const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const config = require('../config.json');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ticket',
    description: 'Manage support tickets (create/close)',

    async execute(message, args) {
        if (!message.guild) return message.channel.send('This command must run in a server.');
        const action = args[0] ? args[0].toLowerCase() : null;
        if (action === 'create') {
            // check if user already has a ticket open (channels named ticket-<user>)
            const existing = message.guild.channels.cache.find(ch => ch.name === `ticket-${message.author.id}`);
            if (existing) return message.channel.send('You already have an open ticket: ' + existing.toString());

            // ensure category
            let category = null;
            if (config.ticketCategory) category = message.guild.channels.cache.get(config.ticketCategory);
            if (!category) {
                // try to find category named Tickets
                category = message.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name.toLowerCase().includes('ticket'));
            }

            const overwrites = [
                {
                    id: message.guild.id,
                    deny: ['VIEW_CHANNEL'],
                },
                {
                    id: message.author.id,
                    allow: ['VIEW_CHANNEL','SEND_MESSAGES','ATTACH_FILES','READ_MESSAGE_HISTORY'],
                }
            ];
            // allow staff role
            if (config.staffRole) {
                overwrites.push({ id: config.staffRole, allow: ['VIEW_CHANNEL','SEND_MESSAGES','READ_MESSAGE_HISTORY'] });
            } else {
                const staffRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');
                if (staffRole) overwrites.push({ id: staffRole.id, allow: ['VIEW_CHANNEL','SEND_MESSAGES','READ_MESSAGE_HISTORY'] });
            }

            const channelData = {
                type: 'GUILD_TEXT',
                topic: `Ticket for ${message.author.tag} (${message.author.id})`,
                permissionOverwrites: overwrites
            };
            if (category) channelData.parent = category.id;

            const channel = await message.guild.channels.create(`ticket-${message.author.id}`, channelData);

            const embed = new MessageEmbed()
                .setColor(config.color && config.color.default ? config.color.default : '#5865F2')
                .setTitle('🎫 New Support Ticket')
                .setDescription(`Hello ${message.author}, thank you for opening a ticket. Please describe your issue below — a staff member will be with you shortly.`)
                .addFields(
                    { name: 'Ticket Owner', value: `${message.author.tag}`, inline: true },
                    { name: 'Channel', value: `${channel}`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Support', iconURL: config.logo || '' });

            // optional thumbnail/logo if available
            if (config.logo) embed.setThumbnail(config.logo);

            // send embed with a Close button
            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId('ticket_close').setLabel('Close Ticket').setStyle('DANGER')
            );
            await channel.send({ embeds: [embed], components: [row] }).catch(() => channel.send({ embeds: [embed] }));
            return message.channel.send({ embeds: [new MessageEmbed().setColor('#57F287').setDescription('Your ticket has been created: ' + channel.toString())] });
        } else if (action === 'close') {
            // only allow in ticket channels
            if (!message.channel.name.startsWith('ticket-')) return message.channel.send('This command can only be used inside a ticket channel.');
            // confirm by user or staff
            try {
                // ask for confirmation by typing 'confirm'
                const prompt = await message.channel.send('Please type `confirm` in this channel within 30 seconds to close this ticket.');
                const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'confirm';
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 }).catch(() => null);
                if (!collected || collected.size === 0) {
                    return message.channel.send('Ticket close cancelled.');
                }

                // build transcript
                try {
                    const fetched = await message.channel.messages.fetch({ limit: 100 });
                    const messages = Array.from(fetched.values()).reverse();
                    const lines = messages.map(m => `${new Date(m.createdTimestamp).toISOString()} <${m.author.tag}>: ${m.content.replace(/\n/g, ' ')}${m.attachments && m.attachments.size ? ' [attachments: ' + m.attachments.map(a=>a.url).join(',') + ']' : ''}`);
                    const ticketsDir = path.resolve(__dirname, '..', 'logs', 'tickets');
                    fs.mkdirSync(ticketsDir, { recursive: true });
                    const filename = path.join(ticketsDir, `${message.channel.name}-${Date.now()}.txt`);
                    fs.writeFileSync(filename, lines.join('\n'));
                    // optionally post transcript to configured log channel
                    if (config.ticketLogChannel) {
                        const logChannel = message.guild.channels.cache.get(config.ticketLogChannel);
                        if (logChannel && logChannel.send) {
                            await logChannel.send({ content: `Transcript for ${message.channel.name}`, files: [filename] }).catch(() => {});
                        }
                    }
                } catch (e) {
                    // continue even if transcript failed
                }

                // send closing embed for record then delete
                const closeEmbed = new MessageEmbed()
                    .setColor('#ED4245')
                    .setTitle('Ticket Closed')
                    .setDescription(`This ticket was closed by ${message.author.tag}`)
                    .setTimestamp();
                try { await message.channel.send({ embeds: [closeEmbed] }); } catch {}
                await message.channel.delete();
            } catch (err) {
                message.channel.send('Failed to close ticket: ' + err.message);
            }
        } else {
            return message.channel.send('Usage: `ticket create` or `ticket close`');
        }
    }
};