module.exports = {
    name: 'end',
    description: 'End the active giveaway in this channel.',

    async execute(message, args, client, log, config) {
        // Check if user is admin
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send('❌ You need administrator permissions to use this command!');
        }

        const fs = require('fs');
        const giveawayPath = './giveaways.json';

        try {
            let giveaways = [];
            if (fs.existsSync(giveawayPath)) {
                giveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
            }

            // Find the most recent active giveaway in this channel
            const activeGiveaway = giveaways.find(g => g.active && g.channelId === message.channel.id);

            if (!activeGiveaway) {
                return message.channel.send('❌ No active giveaway found in this channel!');
            }

            // Mark giveaway as ended
            activeGiveaway.active = false;
            activeGiveaway.endedAt = new Date();

            // Get participants and pick winners
            const participants = activeGiveaway.participants || [];
            const winnersList = participants.sort(() => 0.5 - Math.random()).slice(0, activeGiveaway.winners || 1);

            // Save updated giveaways
            fs.writeFileSync(giveawayPath, JSON.stringify(giveaways, null, 2));

            let endMessage = `🎉 **Giveaway Ended!**\n\n**Prize:** ${activeGiveaway.prize}\n**Total Participants:** ${participants.length}\n**Winners:** ${winnersList.length > 0 ? winnersList.map(w => `<@${w}>`).join(', ') : 'No participants'}`;
            
            await message.channel.send(endMessage);

            log.info(`Giveaway ended by ${message.author.tag}. Winners: ${winnersList.length > 0 ? winnersList.join(', ') : 'None'}`);
        } catch (error) {
            log.error('Error ending giveaway:', error);
            return message.channel.send('❌ Error ending giveaway: ' + error.message);
        }
    }
};
