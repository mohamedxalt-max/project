// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'checkuservouching', // Command name
    description: 'Check if a user is currently required to leave a vouch.', // Command description

    /**
     * Command execute
     * @param {Message} message The message sent by user
     * @param {Array} args Arguments
     */
    async execute(message, args) {
        try {
            // Get the target user
            let target;
            
            // If args[0] is provided (slash command with user ID), fetch the user
            if (args[0]) {
                // Try to get from cache first, then fetch
                target = message.client.users.cache.get(args[0]) || await message.client.users.fetch(args[0]).catch(() => null);
                if (!target) {
                    return message.channel.send(
                        new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Error')
                            .setDescription('Could not find that user.')
                    );
                }
            } else {
                // Otherwise use message author
                target = message.author;
            }
            
            const isWaiting = message.client.waitingForVouch.has(target.id);
            const isMuted = config.muteRole ? (message.guild.members.cache.get(target.id)?.roles.cache.has(config.muteRole) || false) : false;

            const embed = new MessageEmbed()
                .setColor(isWaiting || isMuted ? config.color.red : config.color.green)
                .setAuthor({ name: `Vouch Status: ${target.username}`, iconURL: target.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            if (isMuted) {
                embed.setTitle('❌ Restricted')
                    .setDescription(`${target} is currently **muted** for failing to provide a vouch. They must vouch in <#${config.vouchChannel}> to regain access.`);
            } else if (isWaiting) {
                embed.setTitle('⏳ Vouch Required')
                    .setDescription(`${target} has recently generated an account and is **required to vouch** in <#${config.vouchChannel}> within the next few minutes.`);
            } else {
                embed.setTitle('✅ Clear')
                    .setDescription(`${target} is not currently required to vouch and has full access to the generator.`);
            }

            await message.channel.send(embed);
        } catch (error) {
            console.error('checkuservouching error:', error);
            message.channel.send(
                new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error')
                    .setDescription('An error occurred while checking vouch status.')
            );
        }
    }
};
