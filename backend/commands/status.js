const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'status',
    description: 'Check if a user is online and their current activity',

    async execute(message, args) {
        // Get the mentioned user or use the command executor
        const user = message.mentions.users.first() || message.author;
        
        // Ensure we're in a guild to access member data
        if (!message.guild) return message.channel.send('This command must be used in a server.');

        try {
            const member = await message.guild.members.fetch(user.id);
            
            if (!member) {
                return message.channel.send(`❌ User ${user.tag} not found in this server.`);
            }

            // Get presence data
            const presence = member.presence;
            const status = presence?.status || 'offline';
            const activities = presence?.activities || [];
            const activity = activities[0];

            // Create embed
            const statusEmbed = new MessageEmbed()
                .setColor(
                    status === 'online' ? '#57F287' : 
                    status === 'idle' ? '#FEE75C' : 
                    status === 'dnd' ? '#ED4245' : 
                    '#747F8D'
                )
                .setTitle(`📊 User Status: ${user.username}`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
                .addFields(
                    { name: 'Status', value: `🔘 **${status.toUpperCase()}**`, inline: true },
                    { name: 'User ID', value: `\`${user.id}\``, inline: true },
                    { name: 'Joined Server', value: member.joinedAt ? member.joinedAt.toDateString() : 'Unknown', inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Status Tracker', iconURL: config.logo || user.displayAvatarURL() });

            // Add activity if user has one
            if (activity) {
                let activityText = `**${activity.name}**`;
                if (activity.details) activityText += `\n${activity.details}`;
                if (activity.state) activityText += `\n${activity.state}`;
                if (activity.url) activityText += `\n🎮 [Watch Stream](${activity.url})`;
                
                statusEmbed.addField('Currently', activityText, false);
            } else {
                statusEmbed.addField('Currently', 'No activity', false);
            }

            return message.channel.send({ embeds: [statusEmbed] });

        } catch (error) {
            console.error('Status command error:', error);
            return message.channel.send(`❌ Error checking user status: ${error.message}`);
        }
    }
};
