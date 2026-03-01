const Discord = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'gwcreate',
    description: 'Create a giveaway.',

    async execute(message, args, client, log, config) {
        try {
            // Check permissions
            if (!message.member.permissions.has('ADMINISTRATOR')) {
                return message.channel.send('❌ You need administrator permissions!');
            }

            // Support both message commands and slash-style args array
            let duration, winners, prize, requirements;
            if (args && args.length > 0) {
                duration = args[0];
                winners = parseInt(args[1]);
                prize = args.slice(2).join(' ') || 'Unknown Prize';
                requirements = 'None';
            } else {
                // Parse the message content to get quoted strings
                const content = message.content;
                const regex = /"([^"]*)"/g;
                const quotes = [];
                let m;
                while ((m = regex.exec(content)) !== null) {
                    quotes.push(m[1]);
                }

                // Extract non-quoted arguments
                const parts = content.split(' ').slice(1); // Remove command
                const nonQuoted = parts.filter(p => !p.includes('"'));

                duration = nonQuoted[0];
                winners = parseInt(nonQuoted[1]);
                prize = quotes[0] || nonQuoted.slice(2).join(' ') || 'Unknown Prize';
                requirements = quotes[1] || 'None';
            }

            // Validate
            if (!duration || !duration.match(/^\d+[dhms]$/)) {
                return message.channel.send(`❌ Invalid format!\n\n**Usage:** \`$gwcreate 2d 1 "Prize Name" "Requirements"\`\n\n**Duration examples:** 2d, 1h, 30m, 60s`);
            }

            if (isNaN(winners) || winners < 1) {
                return message.channel.send('❌ Winners must be a valid number!');
            }

            const durationSeconds = parseDuration(duration);
            if (!durationSeconds) {
                return message.channel.send(`❌ Invalid duration! Use: 2d, 1h, 30m, 60s`);
            }

            const giveawayPath = './giveaways.json';
            let giveaways = [];
            if (fs.existsSync(giveawayPath)) {
                giveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
            }

            const endTime = Math.floor((Date.now() + durationSeconds * 1000) / 1000);
            
            const giveaway = {
                id: Date.now(),
                prize: prize,
                duration: durationSeconds * 1000,
                winners: winners,
                requirements: requirements,
                startedAt: new Date(),
                endsAt: new Date(Date.now() + durationSeconds * 1000),
                channelId: message.channel.id,
                messageId: null,
                participants: [],
                active: true,
                createdBy: message.author.id
            };

            giveaways.push(giveaway);
            fs.writeFileSync(giveawayPath, JSON.stringify(giveaways, null, 2));

            // Create embed
            const embed = new Discord.MessageEmbed()
                .setColor('#FFD700')
                .setTitle('🎁 GIVEAWAY STARTED: ' + prize.toUpperCase() + ' 🎁')
                .setDescription('Welcome to this new giveaway system!\n\nTo have a chance to win react to this message with 🎉 !')
                .addFields(
                    { name: 'Prize', value: prize, inline: true },
                    { name: 'Winners', value: winners.toString(), inline: true }
                )
                .addField('Chance Booster', 'Everyone has the same chance to win, but Boosters get 4x Luck! 🙂', false)
                .addField('Participants', '0', true)
                .addField('Valid Votes', '0', true)
                .addField('⏰ Time Left', `<t:${endTime}:R>`, true)
                .addField('Winner', 'Your name could be here :)', false)
                .addField('🛡️ Requirements', requirements, false)
                .addField('👑 Bypassers', 'Owners & Boosters bypass all requirements', false)
                .setFooter({ text: `xM3Dx Giveaway System • ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}` })
                .setTimestamp();

            const sentMessage = await message.channel.send(embed);

            // Add reaction
            await sentMessage.react('🎉').catch(e => log.error('Reaction error:', e));

            // Update message ID
            giveaway.messageId = sentMessage.id;
            giveaways[giveaways.length - 1] = giveaway;
            fs.writeFileSync(giveawayPath, JSON.stringify(giveaways, null, 2));

            log.info(`✓ Giveaway created: ${prize} for ${durationSeconds}s`);

            // Handle reactions
            const filter = (reaction, user) => reaction.emoji.name === '🎉' && !user.bot;
            const collector = sentMessage.createReactionCollector(filter, { time: durationSeconds * 1000 });

            collector.on('collect', async (reaction, user) => {
                let gws = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
                const gw = gws.find(g => g.id === giveaway.id);
                
                if (gw && gw.active) {
                    const existing = gw.participants.findIndex(p => p.userId === user.id);
                    if (existing === -1) {
                        gw.participants.push({ userId: user.id, joinedAt: new Date() });
                        fs.writeFileSync(giveawayPath, JSON.stringify(gws, null, 2));
                    }
                }
            });

            collector.on('end', async () => {
                let updatedGiveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
                const gw = updatedGiveaways.find(g => g.id === giveaway.id);
                
                if (gw && gw.active) {
                    gw.active = false;
                    const participants = gw.participants || [];
                    
                    let winnersList = [];
                    if (participants.length > 0) {
                        const selectedIds = new Set();
                        const availableParticipants = [...participants];
                        
                        for (let i = 0; i < gw.winners && availableParticipants.length > 0; i++) {
                            const randomIdx = Math.floor(Math.random() * availableParticipants.length);
                            const winner = availableParticipants[randomIdx];
                            selectedIds.add(winner.userId);
                            availableParticipants.splice(randomIdx, 1);
                        }
                        winnersList = Array.from(selectedIds);
                    }

                    const resultEmbed = new Discord.MessageEmbed()
                        .setColor('#FF00FF')
                        .setTitle('🎁 GIVEAWAY ENDED 🎁')
                        .setDescription(`**Prize:** ${gw.prize}`)
                        .addFields(
                            { name: 'Participants', value: participants.length.toString(), inline: true },
                            { name: 'Winners', value: winnersList.length.toString(), inline: true },
                            { name: '🏆 Winners', value: winnersList.length > 0 ? winnersList.map(w => `<@${w}>`).join('\n') : 'No participants', inline: false }
                        )
                        .setFooter({ text: `xM3Dx Giveaway System` })
                        .setTimestamp();

                    try {
                        await message.channel.send(resultEmbed);
                        if (winnersList.length > 0) {
                            await message.channel.send(`🎉 Congrats ${winnersList.map(w => `<@${w}>`).join(' ')}! You won **${gw.prize}**!`);
                        }
                    } catch (e) {
                        log.error('Could not send results:', e);
                    }

                    fs.writeFileSync(giveawayPath, JSON.stringify(updatedGiveaways, null, 2));
                }
            });

        } catch (error) {
            log.error('GW Error:', error);
            message.channel.send(`❌ Error: ${error.message}`).catch(() => {});
        }
    }
};

function parseDuration(str) {
    const m = str.toLowerCase().match(/^(\d+)([dhms])$/);
    if (!m) return null;
    const conversions = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(m[1]) * conversions[m[2]];
}
