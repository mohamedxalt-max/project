// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const util = require('util');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

// Promisify writeFile
const writeFile = util.promisify(fs.writeFile);

// Functions
const log = new CatLoggr();

module.exports = {
	name: 'create', // Command name
	description: 'Create a new service.', // Command description

    /**
     * Command exetute
     * @param {Message} message The message sent by user
     * @param {Array[]} args Arguments splitted by spaces after the command name
     */
	async execute(message, args) {
        // Parameters
        const service = args[0];

        // If the "service" parameter is missing
        if (!service) {
            return message.channel.send(
                new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Missing parameters!')
                .setDescription('You need to give a service name!')
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            );
        };

        // File path where create the new service file
        const filePath = `${__dirname}/../stock/${args[0]}.txt`;

        try {
            // Create new file
            await writeFile(filePath, '');

            message.channel.send(
                new MessageEmbed()
                .setColor(config.color.green)
                .setTitle('Service created!')
                .setDescription(`New ${args[0]} service created!`)
                .setFooter(message.author.tag, message.author.displayAvatarURL())
                .setTimestamp()
            );
        } catch (error) {
            log.error('Create command error:', error);
            message.channel.send(
                new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Error!')
                .setDescription(`Failed to create service: ${error.message}`)
                .setFooter(message.author.tag, message.author.displayAvatarURL())
                .setTimestamp()
            );
        }
    }
};
