const { Permissions } = require('discord.js');
const log = require('cat-loggr');

module.exports = {
    name: 'scanvouchuser',
    description: 'Scan if a user has actually vouched in the vouch channel',
    usage: '/scanvouchuser <user>',
    execute: async (message, args) => {
        // Check if user has admin permission
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            return message.channel.send('You need administrator permissions to use this command.');
        }

        // Get user argument (from slash command, args[0] is the user ID)
        if (!args || !args[0]) {
            return message.channel.send('Please provide a user to scan.');
        }

        let targetUser;

        // Fetch the user from the provided ID (slash command provides user ID directly)
        try {
            targetUser = await message.client.users.fetch(args[0]);
        } catch (err) {
            return message.channel.send('Could not find that user. Please provide a valid user ID.');
        }

        // Get vouch channel
        const config = require('../config.json');
        const vouchChannel = message.guild.channels.cache.get(config.vouchChannel);

        if (!vouchChannel) {
            return message.reply('Vouch channel not configured.');
        }

        message.channel.send(`🔍 Scanning vouch channel for **${targetUser.tag}**...`);

        let vouchMessages = [];
        let lastMessage = null;
        let totalScanned = 0;
        let pageCount = 0;
        const maxPages = 50; // Limit to 50 pages (5000 messages) to avoid infinite scanning

        try {
            // Fetch messages from vouch channel with pagination limit
            while (pageCount < maxPages) {
                const options = { limit: 100 };
                if (lastMessage) {
                    options.before = lastMessage.id;
                }

                const messages = await vouchChannel.messages.fetch(options);
                if (messages.size === 0) break;

                for (const msg of messages.values()) {
                    if (msg.author.id === targetUser.id && !msg.author.bot) {
                        // Check if message contains vouch keywords
                        const messageContent = msg.content.toLowerCase().trim();
                        const hasVouchKeyword = (messageContent.length >= 3) && 
                                                (/\bvouch\b/.test(messageContent) || /\blegit\b/.test(messageContent));
                        
                        if (hasVouchKeyword) {
                            vouchMessages.push({
                                content: msg.content,
                                timestamp: msg.createdTimestamp
                            });
                        }
                        totalScanned++;
                    }
                }

                lastMessage = messages.last();
                pageCount++;
            }
        } catch (err) {
            log.error('Error fetching messages:', err);
            return message.channel.send('An error occurred while scanning the vouch channel.');
        }

        // Build response
        let response = `**Scan Results for ${targetUser.tag}**\n\n`;
        response += `Total messages scanned: ${totalScanned}\n`;
        response += `Valid vouch messages: ${vouchMessages.length}\n\n`;

        if (vouchMessages.length > 0) {
            response += '✅ **User HAS VOUCHED**\n\n';
            response += '📝 Vouch Messages:\n';
            
            // Show last 3 vouch messages
            vouchMessages.slice(-3).forEach((msg, index) => {
                response += `${index + 1}. "${msg.content}" <t:${Math.floor(msg.timestamp / 1000)}:R>\n`;
            });

            // Try to assign vouch role if they don't have it
            try {
                const member = await message.guild.members.fetch(targetUser.id);
                const vouchRole = config.vouchRole;
                
                if (vouchRole && !member.roles.cache.has(vouchRole)) {
                    await member.roles.add(vouchRole);
                    response += `\n✅ Assigned vouch role to ${targetUser.tag}`;
                    log.info(`Gave vouch role to ${targetUser.tag} via scanvouchuser`);
                } else if (vouchRole && member.roles.cache.has(vouchRole)) {
                    response += `\n✅ ${targetUser.tag} already has the vouch role`;
                }
            } catch (err) {
                response += `\n⚠️ Could not assign role: ${err.message}`;
                log.error(`Failed to add role to user ${targetUser.id}:`, err);
            }
        } else {
            response += '❌ **User HAS NOT VOUCHED**\n\n';
            response += 'This user has not posted any messages containing "vouch" or "legit" in the vouch channel.';
        }

        message.channel.send(response);
    }
};
