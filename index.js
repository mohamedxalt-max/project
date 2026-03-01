// Dependencies
require('dotenv').config();
const Discord = require('discord.js'); 
const fs = require('fs');
const config = require('./config.json');

// automatically add banner image to every embed if configured
if (config.banner) {
    const OriginalEmbed = Discord.MessageEmbed;
    Discord.MessageEmbed = class extends OriginalEmbed {
        constructor(data) {
            super(data);
            try { this.setImage(config.banner); } catch {}
        }
    };
}

const CatLoggr = require('cat-loggr');
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// serve static files from project root (e.g. logo.png)
app.use(express.static(path.resolve(__dirname)));
app.get('/', (req, res) => res.send('Online Yo boi!!  See <a href="/terms">Terms & Privacy</a> | <a href="/contact">Contact Us</a>'))

// serve terms and privacy policy for bot verification
app.get('/terms', (req, res) => {
    if (config.publicTermsUrl) {
        // redirect to externally hosted page if config specifies it
        return res.redirect(config.publicTermsUrl);
    }
    // serve an HTML page with the policies
    res.sendFile(path.resolve(__dirname, 'terms.html'));
});
app.get('/privacy', (req, res) => {
    if (config.publicTermsUrl) {
        return res.redirect(config.publicTermsUrl);
    }
    // privacy link points to same HTML page
    res.redirect('/terms');
});

// Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'contact.html'));
});

// API endpoint to get Discord owner status
app.get('/api/discord-status', async (req, res) => {
    try {
        // allow cross-origin requests from the frontend
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (!config.ownerID || config.ownerID === 'YOUR_DISCORD_USER_ID_HERE') {
            return res.status(400).json({ 
                error: 'Owner ID not configured',
                status: 'offline',
                activity: null
            });
        }

        // Wait for bot to be ready
        if (!client.isReady()) {
            return res.status(503).json({ 
                error: 'Bot not ready',
                status: 'offline',
                activity: null
            });
        }

        const user = await client.users.fetch(config.ownerID).catch(() => null);
        if (!user) {
            return res.json({ 
                status: 'offline',
                activity: null
            });
        }

        // Try to get presence from guilds the bot is in. If not cached, try fetching the member.
        let presence = null;
        for (const guild of client.guilds.cache.values()) {
            let member = guild.members.cache.get(user.id);
            if (!member) {
                try {
                    member = await guild.members.fetch(user.id).catch(() => null);
                } catch (e) {
                    member = null;
                }
            }
            if (member && member.presence) {
                presence = member.presence;
                break;
            }
        }

        const status = presence?.status || 'offline';
        const activity = presence?.activities?.[0]?.name || null;

        // include some diagnostic info to help with deployment verification
        const debug = req.query.debug === 'true';
        const payload = {
            status: status,
            activity: activity,
            user: user.username
        };
        if (debug) {
            payload.botReady = client.isReady();
            payload.guilds = client.guilds.cache.size;
            payload.ownerID = config.ownerID;
        }

        return res.json(payload);

    } catch (error) {
        console.error('Error fetching Discord status:', error);
        res.status(500).json({ 
            error: 'Failed to fetch status',
            status: 'offline',
            activity: null
        });
    }
});

const server = app.listen(port, () => {
    log.info(`Express server listening at http://localhost:${port}`)
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        log.warn(`Port ${port} is in use, bot will still run!`);
    } else {
        log.error('Express server error:', err);
    }
});
// Functions
const client = new Discord.Client({ intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_MEMBERS,
    Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Discord.Intents.FLAGS.GUILD_PRESENCES
 ] });
client.waitingForVouch = new Map(); // Track users who need to vouch
client.hasVouched = new Set(); // Track users who have vouched
client.invites = new Map(); // Cache of invites per guild: guildId -> Map(code -> uses)
client.inviterMap = new Map(); // Map of memberId -> inviterId for lookup
const log = new CatLoggr();

// helper to build embeds using config settings (color, banner image)
function makeEmbed() {
    const embed = new Discord.MessageEmbed()
        .setColor(config.color && config.color.default ? config.color.default : '#5865F2');
    return embed;
}
// expose helper so command modules may call it easily
client.makeEmbed = makeEmbed;

// New discord collections
client.commands = new Discord.Collection();

// Logging
if (config.debug === true) client.on('debug', stream => log.debug(stream)); // if debug is enabled in config
client.on('warn', message => log.warn(message));
client.on('error', error => log.error(error));

// Load command files (use project-relative paths)
const commandsPath = path.resolve(__dirname, 'commands');
let commandFiles = [];
try {
    commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
} catch (e) {
    log.warn('Commands directory not found:', commandsPath);
    commandFiles = [];
}
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    try {
        log.init(`Loaded command ${file.split('.')[0] === command.name ? file.split('.')[0] : `${file.split('.')[0]} as ${command.name}`}`);
    } catch (e) {
        // ignore logging issues
    }
    client.commands.set(command.name, command);
}

// Load welcome/invite handler
try {
    require('./welcome')(client, config, log);
} catch (err) {
    log.warn('Failed to load welcome handler:', err.message || err);
}

// Ready handler: set presence, populate invite cache, register slash commands
client.once('ready', async () => {
    log.info(`I am logged in as ${client.user.tag} to Discord!`);
    const activityText = config.vanity || 'Type /gen to start!';
    client.user.setActivity(activityText, { type: 'WATCHING' });

    // Populate invite caches
    try {
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const invites = await guild.invites.fetch();
                const codeUses = new Map();
                invites.forEach(inv => codeUses.set(inv.code, inv.uses));
                client.invites.set(guild.id, codeUses);
            } catch (err) {
                log.warn(`Could not fetch invites for guild ${guildId}: ${err.message}`);
            }
        }
        log.info('Invite caches populated for available guilds.');
    } catch (err) {
        log.error('Error populating invite caches:', err);
    }

    // Register slash commands dynamically from loaded command modules
    try {
        const stockPath = path.resolve(__dirname, 'stock');
        const services = fs.existsSync(stockPath) ? fs.readdirSync(stockPath).filter(f => f.endsWith('.txt')).map(f => f.replace('.txt', '')) : [];
        const commands = [];
        client.commands.forEach(cmd => {
            const cmdDef = { name: cmd.name, description: cmd.description || 'No description provided.' };
            if (cmd.name === 'gen') {
                cmdDef.options = [{
                    name: 'service',
                    description: 'The service to generate',
                    type: 3, // STRING
                    required: true,
                    choices: services.map(s => ({ name: s, value: s }))
                }];
            } else if (cmd.name === 'games') {
                cmdDef.options = [{
                    name: 'game',
                    description: 'Which game to play',
                    type: 3, // STRING
                    required: false,
                    choices: [
                        { name: 'math', value: 'math' },
                        { name: 'roulette', value: 'roulette' }
                    ]
                }];
            } else if (cmd.name === 'promote') {
                cmdDef.options = [{
                    name: 'user',
                    description: 'The user to promote',
                    type: 6, // USER
                    required: true
                }];
            } else if (cmd.name === 'welcomeset') {
                cmdDef.options = [{
                    name: 'channel',
                    description: 'The channel to set as welcome channel',
                    type: 7, // CHANNEL
                    required: true
                }];
            } else if (cmd.name === 'ticket') {
                cmdDef.options = [{
                    name: 'action',
                    description: 'create or close ticket',
                    type: 3, // STRING
                    required: true,
                    choices: [
                        { name: 'create', value: 'create' },
                        { name: 'close', value: 'close' }
                    ]
                }];
            } else if (cmd.name === 'invites' || cmd.name === 'invited') {
                // optional user argument for both commands
                cmdDef.options = [{
                    name: 'user',
                    description: 'The user to query (defaults to you)',
                    type: 6, // USER
                    required: false
                }];
            } else if (cmd.name === 'gwcreate') {
                // structured options; slash command may not support quoted prizes so separate fields
                cmdDef.options = [
                    { name: 'duration', description: 'Duration (e.g. 2d, 1h, 30m, 60s)', type: 3, required: true },
                    { name: 'winners', description: 'Number of winners', type: 4, required: true },
                    { name: 'prize', description: 'What prize is being given away', type: 3, required: true },
                    { name: 'requirements', description: 'Eligibility requirements', type: 3, required: false }
                ];
            } else if (cmd.name === 'givexp') {
                cmdDef.options = [
                    { name: 'user', description: 'User to give XP to', type: 6, required: true },
                    { name: 'amount', description: 'Amount of XP', type: 4, required: true }
                ];
            } else if (cmd.name === 'levels') {
                cmdDef.options = [{
                    name: 'user', description: 'User to check level for', type: 6, required: false
                }];
            }
            commands.push(cmdDef);
        });

        // Register guild and global slash commands using discord.js v13 API
        try {
            // set global commands
            await client.application.commands.set(commands).catch(e => log.warn('Failed to set global commands:', e.message));
        } catch (e) {
            log.warn(`Failed to upsert global commands: ${e.message}`);
        }
        try {
            const guildIds = client.guilds.cache.map(g => g.id);
            for (const guildId of guildIds) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue;
                await guild.commands.set(commands).catch(e => log.warn(`Failed to set guild commands for ${guildId}: ${e.message}`));
            }
        } catch (e) {
            log.warn('Failed to upsert guild commands:', e.message);
        }

        log.info('Successfully registered slash commands (Guild & Global).');
        log.info(`Registered ${commands.length} slash commands: ${commands.map(c => c.name).join(', ')}`);
        
        log.info('Successfully registered slash commands (Guild & Global).');
        log.info(`Registered ${commands.length} slash commands: ${commands.map(c => c.name).join(', ')}`);
    } catch (error) {
        log.error('Failed to register slash commands:', error);
    }
});

        // Interaction handling using discord.js v13
        client.on('interactionCreate', async (interaction) => {
            // handle button interactions for ticket create
            if (interaction.isButton()) {
                if (interaction.customId === 'ticket_create_btn') {
                    const guild = interaction.guild;
                    const member = interaction.member;
                    const ticketCmd = client.commands.get('ticket');
                    if (!ticketCmd) {
                        await interaction.reply({ content: 'Ticket command not available.', ephemeral: true }).catch(() => {});
                        return;
                    }
                    // Create a mock message for the ticket create flow
                    const mockMessage = {
                        member,
                        guild,
                        channel: interaction.channel,
                        client,
                        content: '/ticket',
                        author: interaction.user,
                        mentions: { users: new Discord.Collection() }
                    };
                    try {
                        await ticketCmd.execute(mockMessage, ['create'], client, log, config);
                        await interaction.reply({ content: '✅ Ticket created! Check your DMs or the ticket channel.', ephemeral: true }).catch(() => {});
                    } catch (e) {
                        await interaction.reply({ content: 'Failed to create ticket: ' + (e.message || e), ephemeral: true }).catch(() => {});
                    }
                    return;
                } else if (interaction.customId === 'ticket_close') {
                    const guild = interaction.guild;
                    const member = interaction.member;
                    const channel = interaction.channel;
                    const ticketCmd = client.commands.get('ticket');
                    if (!ticketCmd) {
                        await interaction.reply({ content: 'Ticket command not available.', ephemeral: true }).catch(() => {});
                        return;
                    }
                    const mockMessage = {
                        member,
                        guild,
                        channel,
                        client,
                        content: '/ticket',
                        author: interaction.user,
                        mentions: { users: new Discord.Collection() }
                    };
                    try {
                        await ticketCmd.execute(mockMessage, ['close'], client, log, config);
                        await interaction.reply({ content: 'Close flow initiated. Check channel for confirmation prompt.', ephemeral: true }).catch(() => {});
                    } catch (e) {
                        await interaction.reply({ content: 'Failed to initiate close: ' + (e.message || e), ephemeral: true }).catch(() => {});
                    }
                    return;
                }
            }
            if (!interaction.isCommand()) return;
            const name = interaction.commandName;
            const command = client.commands.get(name);
            if (!command) return;

            try {
                await interaction.deferReply({ ephemeral: false }).catch(() => {});

                const guild = interaction.guild;
                const member = interaction.member;
                const channel = interaction.channel;

                // helper to reply/edit/followup using the interaction
                let firstReply = true;
                const interactionResponse = {
                    reply: async (content) => {
                        try {
                            if (content instanceof Discord.MessageEmbed) {
                                if (firstReply) { firstReply = false; return await interaction.editReply({ embeds: [content.toJSON ? content.toJSON() : content] }); }
                                return await interaction.followUp({ embeds: [content.toJSON ? content.toJSON() : content] });
                            } else if (content && content.embeds) {
                                if (firstReply) { firstReply = false; return await interaction.editReply(content); }
                                return await interaction.followUp(content);
                            } else {
                                if (firstReply) { firstReply = false; return await interaction.editReply({ content: content }); }
                                return await interaction.followUp({ content: content });
                            }
                        } catch (e) {
                            log.warn('Failed to send interaction reply (channel may be invalid):', e.message);
                            try { 
                                return await interaction.editReply({ content: String(content).substring(0, 2000) }); 
                            } catch (e2) {
                                log.error('Failed to send fallback reply:', e2.message);
                            }
                        }
                    }
                };

                // Use the real channel object but override .send to route to interaction reply for the first message
                const mockChannel = channel;
                const origSend = mockChannel && mockChannel.send ? mockChannel.send.bind(mockChannel) : null;
                mockChannel.send = async (c) => interactionResponse.reply(c);

                const mockMessage = {
                    member: member,
                    guild: guild,
                    channel: mockChannel,
                    client: client,
                    content: `/${name}`,
                    author: interaction.user,
                    mentions: { users: new Discord.Collection() }
                };

                // build args from interaction options
                const args = [];
                const hoisted = interaction.options && interaction.options._hoistedOptions ? interaction.options._hoistedOptions : (interaction.options && interaction.options.data ? interaction.options.data : []);
                hoisted.forEach(o => args.push(o.value));

                await command.execute(mockMessage, args, client, log, config);
            } catch (err) {
                log.error('Interaction error:', err);
                try { if (!interaction.replied) await interaction.editReply({ content: 'An error occurred while executing this command.' }); } catch (e) {}
            }
        });

        // Discord messageCreate event and command handling (v13 compatible)
client.on('messageCreate', (message) => {
    // Auto reaction and vouch check in vouch channel
    if (message.channel.id === config.vouchChannel && !message.author.bot) {
        // Check if message contains vouch keywords (must be actual words, min 3 chars)
        const messageContent = message.content.toLowerCase().trim();
        const hasVouchKeyword = (messageContent.length >= 3) && 
                                (/\bvouch\b/.test(messageContent) || /\blegit\b/.test(messageContent));
        
        // If user was waiting to vouch, clear their timeout
        if (client.waitingForVouch.has(message.author.id) && hasVouchKeyword) {
            const timeout = client.waitingForVouch.get(message.author.id);
            clearTimeout(timeout);
            client.waitingForVouch.delete(message.author.id);
            client.hasVouched.add(message.author.id); // Mark user as having vouched
            
            // Give vouch role
            if (config.vouchRole && message.member) {
                const vouchRole = message.guild.roles.cache.get(config.vouchRole);
                if (vouchRole) {
                    message.member.roles.add(vouchRole).catch(err => log.error('Failed to add vouch role:', err));
                    log.info(`Gave vouch role to ${message.author.tag}`);
                }
            }
            
            log.info(`User ${message.author.tag} vouched in time.`);
            
            message.reply('Thank you for vouching! Your generation access is secured.').then(m => m.delete({ timeout: 5000 }).catch(() => {}));
            
            // Also unmute them if they have the mute role and they just vouched
            if (config.muteRole && message.member.roles.cache.has(config.muteRole)) {
                message.member.roles.remove(config.muteRole).catch(err => log.error('Failed to remove mute role after vouch:', err));
                log.info(`Unmuted ${message.author.tag} after they vouched.`);
                message.reply('You have been unmuted for vouching!').then(m => m.delete({ timeout: 5000 }).catch(() => {}));
            }

            const legitEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'LEGIT');
            if (legitEmoji) {
                message.react(legitEmoji).catch(err => log.error('Failed to react in vouch channel:', err));
            } else {
                // Fallback if custom emoji doesn't exist by name
                message.react('✅').catch(err => log.error('Failed to react in vouch channel:', err));
            }
        } else if (hasVouchKeyword && !client.waitingForVouch.has(message.author.id) && !client.hasVouched.has(message.author.id)) {
            // User is vouching voluntarily - still give them the role for future use
            client.hasVouched.add(message.author.id);
            
            if (config.vouchRole && message.member) {
                const vouchRole = message.guild.roles.cache.get(config.vouchRole);
                if (vouchRole) {
                    message.member.roles.add(vouchRole).catch(err => log.error('Failed to add vouch role:', err));
                    log.info(`Gave vouch role to ${message.author.tag} (voluntary vouch)`);
                }
            }
            
            const legitEmoji = message.guild.emojis.cache.find(emoji => emoji.name === 'LEGIT');
            if (legitEmoji) {
                message.react(legitEmoji).catch(err => log.error('Failed to react in vouch channel:', err));
            } else {
                message.react('✅').catch(err => log.error('Failed to react in vouch channel:', err));
            }
        }
    }

    if (!message.content.startsWith(config.prefix)) return; // If the message does not start with the prefix 
    if (message.author.bot) return; // If a command executed by a bot

    // Split message content to arguments
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

    // If the command does not exists
        if (config.command.notfound_message === true && !client.commands.has(command)) {
        return message.channel.send(
            new Discord.MessageEmbed()
            .setColor(config.color.red)
            .setTitle('Unknown command :(')
            .setDescription(`Sorry, but I cannot find the \`${command}\` command!`)
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
            .setTimestamp()
        );
    };

    // Executing the command
        try {
                client.commands.get(command).execute(message, args); // Execute
        } catch (error) {
                log.error(error); // Logging if error

        // Send error messsage if the "error_message" field is "true" in the configuration
                if (config.command.error_message === true) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor(config.color.red)
                .setTitle('Error occurred!')
                .setDescription(`An error occurred while executing the \`${command}\` command!`)
                .addFields({ name: 'Error', value: `\`\`\`js\n${error}\n\`\`\`` })
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp()
            );
        };
        };
});

// Ensure the bot logs in using the token in environment variables (optional for local server testing)
const token = process.env.DISCORD_TOKEN || process.env.TOKEN;
let skipDiscordLogin = false;
if (!token) {
    log.warn('No Discord token found in environment. Running web server without Discord connection.');
    skipDiscordLogin = true;
} else {
    client.login(token).then(() => {
        log.info('Login attempt initiated.');
    }).catch(err => {
        log.error('Failed to login:', err);
        // do not exit so the web server remains available for debugging
        skipDiscordLogin = true;
    });
}
