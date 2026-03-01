// Dependencies
const { MessageEmbed, Message } = require('discord.js');
const fs = require('fs');
const util = require('util');
const config = require('../config.json');
const CatLoggr = require('cat-loggr');

// Promisify fs functions for async/await support
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

// Functions
const log = new CatLoggr();
const generated = new Set();

module.exports = {
        name: 'gen', // Command name
        description: 'Generate a specified service if stocked.', // Command description

    /**
     * Command exetute
     * @param {Message} message The message sent by user
     * @param {Array[]} args Arguments splitted by spaces after the command name
     */
        async execute(message, args) {
        // Check if this is a slash command or regular command
        const isSlashCommand = message.content.startsWith('/');

        // If the generator channel is not given in config or invalid
        try {
            message.client.channels.cache.get(config.genChannel).id; // Try to get the channel's id
        } catch (error) {
            if (error) log.error(error); // If an error occured log to console

            // Send error messsage if the "error_message" field is "true" in the configuration
            if (config.command.error_message === true) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Error occured!')
                    .setDescription('Not a valid gen channel specified!')
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            } else return;
        };

        // Restrict to specific channel and owner only
        const ALLOWED_CHANNEL = '1477272086635483136';
        const ALLOWED_ROLE = '1466408703967367198';

        if (message.channel.id === ALLOWED_CHANNEL) {
            // Check if user is guild owner
            const isOwner = message.author.id === message.guild.ownerId;
            // Check if user has the specific role
            const hasRole = message.member.roles.cache.has(ALLOWED_ROLE);

            if (!isOwner || !hasRole) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Access Denied!')
                    .setDescription(`Only the server owner with role <@&${ALLOWED_ROLE}> can use the gen command!`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            }

            const isMuted = config.muteRole ? message.member.roles.cache.has(config.muteRole) : false;
            const hasVouched = message.client.hasVouched.has(message.author.id) || message.client.waitingForVouch.has(message.author.id);
            const status = message.member.presence?.activities.find(a => a.type === 'CUSTOM_STATUS')?.state || '';
            const hasVanity = config.vanity ? status.includes(config.vanity) : true;

            if (isMuted) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Access Denied!')
                    .setDescription(`You are currently restricted from using the generator! Please leave a vouch in <#${config.vouchChannel}> to regain access.`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            }

            // Check if user has never vouched before (except if they have access from a previous vouch)
            if (!hasVouched) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Access Denied!')
                    .setDescription(`You must leave a vouch in <#${config.vouchChannel}> first before you can use the generator!`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            }

            if (!hasRole || !hasVanity) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Access Denied!')
                    .setDescription(`You must have the required role and put **${config.vanity}** in your status/bio to get access to the generator! (Case-sensitive, no missing letters allowed)`)
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            }

            // If the user have cooldown on the command
            if (generated.has(message.author.id)) {
                return message.channel.send(
                    new MessageEmbed()
                    .setColor(config.color.red)
                    .setTitle('Cooldown!')
                    .setDescription('Please wait **3 minutes** before executing that command again!')
                    .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                    .setTimestamp()
                );
            } else {
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
                
                // File path to find the given service
                const filePath = `${__dirname}/../stock/${args[0]}.txt`;

                // Cache author data
                const authorTag = message.author.tag;
                const authorUsername = message.author.username;
                const authorAvatarURL = message.author.displayAvatarURL({ dynamic: true, size: 64 });
                const authorAvatarURLSmall = message.author.displayAvatarURL({ dynamic: true });

                try {
                    // Read the service file
                    const data = await readFile(filePath, 'utf8');
                    const position = data.indexOf('\n');
                    const firstLine = data.split('\n')[0];

                    // If the service file is empty
                    if (position === -1) {
                        return message.channel.send(
                            new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`I do not find the \`${args[0]}\` service in my stock!`)
                            .setFooter(authorTag, authorAvatarURL)
                            .setTimestamp()
                        );
                    }

                    // Send messages to the user
                    try {
                        await message.author.send(
                            new MessageEmbed()
                            .setColor(config.color.default)
                            .setAuthor({ name: `${authorUsername}'s Generation`, iconURL: authorAvatarURLSmall })
                            .setTitle('✨ Account Successfully Generated ✨')
                            .setDescription(`Hello ${message.author}! Your requested credentials are ready. Please follow the instructions below to maintain access.`)
                            .addField('📂 Service Information', `\`\`\`fix\n${args[0][0].toUpperCase()}${args[0].slice(1).toLowerCase()}\n\`\`\``, true)
                            .addField('🔑 Account Credentials', `\`\`\`yaml\n${firstLine}\n\`\`\``, true)
                            .addField('🛡️ Protection & Vouches', `📜 To continue using our services, please leave a vouch in <#${config.vouchChannel}>.\n⚡ **Cooldown:** 3 minutes remaining.`, false)
                            .setFooter('Powered by xM3Dx Gen System', message.client.user.displayAvatarURL())
                            .setTimestamp()
                        );
                    } catch (dmErr) {
                        log.warn(`Could not send DM to ${authorTag}: ${dmErr.message}`);
                    }

                    // Write the updated file (remove first line)
                    const updatedData = data.substr(position + 1);
                    await writeFile(filePath, updatedData);

                    // Send success message to channel
                    await message.channel.send(
                        new MessageEmbed()
                        .setColor(config.color.green)
                        .setTitle('Account generated successfully!')
                        .setDescription(`Check your private ${message.author}! *If you did not receive the message, please unlock your private!*`)
                        .setFooter(authorTag, authorAvatarURL)
                        .setTimestamp()
                    );

                    generated.add(message.author.id); // Add user to the cooldown set

                    // Set up Vouch Requirement
                    const member = message.member;
                    if (member && config.muteRole) {
                        const muteRole = message.guild.roles.cache.get(config.muteRole);
                        if (muteRole) {
                            // Clear existing timer if they somehow generated again
                            if (message.client.waitingForVouch.has(message.author.id)) {
                                clearTimeout(message.client.waitingForVouch.get(message.author.id));
                            }

                            log.info(`Started 3-minute vouch timer for ${authorTag} (${message.author.id})`);

                            // Start the 3-minute timer for vouching
                            const vouchTimeout = setTimeout(async () => {
                                // Double check if they are still in the map (haven't vouched)
                                if (!message.client.waitingForVouch.has(message.author.id)) return;

                                try {
                                    // Re-fetch member to ensure we have latest data
                                    const currentMember = await message.guild.members.fetch(message.author.id).catch(() => null);
                                    if (!currentMember) return;

                                    // Apply Mute Role
                                    await currentMember.roles.add(muteRole).catch(err => log.error('Failed to add mute role:', err));
                                    // Remove vouch role if they have it
                                    if (config.vouchRole && currentMember.roles.cache.has(config.vouchRole)) {
                                        await currentMember.roles.remove(config.vouchRole).catch(err => log.error('Failed to remove vouch role:', err));
                                    }

                                    log.info(`Muted ${authorTag} for failing to vouch after 3 minutes.`);

                                    // Send Log to Log Channel
                                    const logChannel = message.guild.channels.cache.get(config.logChannel) || await message.client.channels.fetch(config.logChannel).catch(() => null);
                                    if (logChannel) {
                                        logChannel.send(
                                            new MessageEmbed()
                                            .setColor(config.color.red)
                                            .setAuthor({ name: '🔒 Access Restricted', iconURL: message.client.user.displayAvatarURL() })
                                            .setTitle('Vouch Requirement Failed')
                                            .setDescription(`**User:** ${message.author}\n**Reason:** Failed to vouch in <#${config.vouchChannel}> within 3 minutes.`)
                                            .addField('⚠️ Notice', `Member has been muted for failing to provide a vouch after generation.`, false)
                                            .setThumbnail(authorAvatarURLSmall)
                                            .setFooter(`ID: ${message.author.id}`)
                                            .setTimestamp()
                                        ).catch(() => {});
                                    }
                                } catch (err) {
                                    log.error('Error in vouch timeout execution:', err);
                                } finally {
                                    // Always remove from the map after execution
                                    message.client.waitingForVouch.delete(message.author.id);
                                }
                            }, 180000); // 3 minutes in milliseconds

                            // Store the timeout in the client's map
                            message.client.waitingForVouch.set(message.author.id, vouchTimeout);
                        }
                    }

                    // Set cooldown time (3 minutes)
                    setTimeout(() => {
                        generated.delete(message.author.id); // Remove the user from the cooldown set after expire
                    }, 3 * 60 * 1000);

                } catch (error) {
                    log.error('Gen command error:', error);
                    
                    // Check if file not found or other error
                    if (error.code === 'ENOENT') {
                        return message.channel.send(
                            new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`Service \`${args[0]}\` does not exist!`)
                            .setFooter(authorTag, authorAvatarURL)
                            .setTimestamp()
                        );
                    } else {
                        return message.channel.send(
                            new MessageEmbed()
                            .setColor(config.color.red)
                            .setTitle('Generator error!')
                            .setDescription(`An error occurred while generating: ${error.message}`)
                            .setFooter(authorTag, authorAvatarURL)
                            .setTimestamp()
                        );
                    }
                }
            };
        } else {
            // If the command executed in another channel
            message.channel.send(
                new MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Wrong command usage!')
                .setDescription(`You cannot use the \`gen\` command in this channel! Try it in <#1477272086635483136>!`)
                .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
                .setTimestamp()
            );
        };
        }
};
