const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'music',
    description: 'Music command for members',
    
    async execute(message, args) {
        const embed = new MessageEmbed()
            .setColor('000000')
            .setTitle('🎵 Music')
            .setDescription('Music player features coming soon!')
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp();
        
        return message.channel.send({ embeds: [embed] });
    }
};
