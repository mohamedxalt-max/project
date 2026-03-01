// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

const log = new CatLoggr();

module.exports = {
    name: 'scanvouch',
    description: 'Scan vouch channel and give role to all who vouched.',

    async execute(message) {
        try {
            // Only allow admins
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Permission Denied')
                        .setDescription('Only admins can use this command.')
                );
            }

            if (!config.vouchRole || config.vouchRole === 'PASTE_YOUR_VOUCH_ROLE_ID_HERE') {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error')
                        .setDescription('Vouch role not configured! Update `vouchRole` in config.json first.')
                );
            }

            await message.channel.send('🔄 Scanning vouch channel...');

            const vouchChannel = message.guild.channels.cache.get(config.vouchChannel);
            if (!vouchChannel) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error')
                        .setDescription('Vouch channel not found!')
                );
            }

            const vouchRole = message.guild.roles.cache.get(config.vouchRole);
            if (!vouchRole) {
                return message.channel.send(
                    new MessageEmbed()
                        .setColor(config.color.red)
                        .setTitle('Error')
                        .setDescription('Vouch role not found!')
                );
            }

            let processed = 0;
            let success = 0;
            let failed = 0;
            let skipped = 0;
            const userIds = new Map(); // Map to store userId and their messages

            // Fetch all messages from vouch channel
            let lastMessage = null;
            let totalMessages = 0;

            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const options = { limit: 100 };
                    if (lastMessage) {
                        options.before = lastMessage.id;
                    }

                    const messages = await vouchChannel.messages.fetch(options);
                    if (messages.size === 0) break;

                    for (const msg of messages.values()) {
                        if (!msg.author.bot) {
                            // Check if message contains vouch keywords
                            const messageContent = msg.content.toLowerCase().trim();
                            const hasVouchKeyword = (messageContent.length >= 3) && 
                                                    (/\bvouch\b/.test(messageContent) || /\blegit\b/.test(messageContent));
                            
                            if (hasVouchKeyword) {
                                userIds.set(msg.author.id, msg.author);
                            }
                            totalMessages++;
                        }
                    }

                    lastMessage = messages.last();
                }
            } catch (err) {
                log.error('Error fetching messages:', err);
            }

            // Give role to all users who actually vouched
            for (const [userId, user] of userIds) {
                try {
                    const member = await message.guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        await member.roles.add(vouchRole);
                        success++;
                        log.info(`Gave vouch role to ${member.user.tag}`);
                    }
                    processed++;
                } catch (err) {
                    failed++;
                    processed++;
                    log.error(`Failed to add role to user ${userId}:`, err);
                }
            }

            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.green)
                    .setTitle('✅ Vouch Role Scan Complete')
                    .addFields(
                        { name: 'Messages Scanned', value: `${totalMessages}`, inline: true },
                        { name: 'Unique Users', value: `${userIds.size}`, inline: true },
                        { name: 'Successful', value: `${success}`, inline: true },
                        { name: 'Failed', value: `${failed}`, inline: true }
                    )
                    .setFooter(message.author.tag, message.author.displayAvatarURL())
                    .setTimestamp()
            );
        } catch (error) {
            log.error('Scanvouch command error:', error);
            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error')
                    .setDescription(`An error occurred: ${error.message}`)
            );
        }
    }
};
