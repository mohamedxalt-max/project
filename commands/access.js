// Dependencies
const { MessageEmbed } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'setupaccess',
    description: 'Post the aesthetic access guide to the channel.',

    execute(message) {
        // Delete the command message
        message.delete().catch(() => {});

        const embed = new MessageEmbed()
            .setColor(config.color.default)
            .setAuthor({ name: 'xM3Dx Generation System', iconURL: message.client.user.displayAvatarURL() })
            .setTitle('🔓 How to Gain Generator Access')
            .setDescription(`Welcome to the community! To use our automated generators, you must follow the simple steps below.`)
            .addField('1️⃣ Update Your Status', `Put the following text in your Discord status or bio:\n\`\`\`${config.vanity}\`\`\``, false)
            .addField('2️⃣ Wait for Auto-Role', `The bot will automatically grant you the **Generator Access** role within seconds of updating your status.`, false)
            .addField('3️⃣ Start Generating', `Once you have the role, head over to <#${config.genChannel}> and use the \`${config.prefix}gen\` command!`, false)
            .addField('⚠️ Important Rules', `• Do not remove the status or you will lose access.\n• There is a 5-minute cooldown between generations.\n• You will be temporarily restricted if you don't vouch in <#${config.vouchChannel}>.`, false)
            
            .setFooter('Secure & Reliable • xM3Dx Gen')
            .setTimestamp();

        message.channel.send(embed);
    }
};