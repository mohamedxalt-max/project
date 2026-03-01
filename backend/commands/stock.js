// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const util = require('util');
const config = require('../config.json');

// Promisify fs functions
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

module.exports = {
	name: 'stock', // Command name
	description: 'Display the service stock.', // Command description

    /**
     * Command exetute
     * @param {Message} message The message sent by user
     */
	async execute(message) {
        try {
            // Arrays
            const stock = [];

            // Read all of the services
            const files = await readdir(`${__dirname}/../stock/`);

            // Filter for .txt files
            const txtFiles = files.filter(file => file.endsWith('.txt'));

            const embed = new MessageEmbed()
                .setColor(config.color.default)
                .setTitle(`${message.guild.name} has **${txtFiles.length} services**`)
                .setDescription('');

            // Process each service file
            for (const file of txtFiles) {
                const filePath = `${__dirname}/../stock/${file}`;
                const content = await readFile(filePath, 'utf-8');
                const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
                embed.description += `**${file.replace('.txt', '')}:** \`${lines.length}\`\n`;
            }

            await message.channel.send(embed);
        } catch (error) {
            console.error('Stock command error:', error);
            message.channel.send(
                new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Error!')
                .setDescription(`Failed to read stock: ${error.message}`)
            );
        }
    }
};
