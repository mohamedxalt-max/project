const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');
const log = require('cat-loggr');

const XP_PER_LEVEL = 1000;
const xpFile = path.join(__dirname, '../xp.json');

// Helper functions
const getXPData = () => {
    try {
        if (!fs.existsSync(xpFile)) {
            fs.writeFileSync(xpFile, '{}');
            return {};
        }
        return JSON.parse(fs.readFileSync(xpFile, 'utf8'));
    } catch (err) {
        log.error('Error reading XP data:', err);
        return {};
    }
};

const saveXPData = (data) => {
    try {
        fs.writeFileSync(xpFile, JSON.stringify(data, null, 2));
    } catch (err) {
        log.error('Error saving XP data:', err);
    }
};

const getUserLevel = (xp) => {
    return Math.floor(xp / XP_PER_LEVEL);
};

const getXPForLevel = (level) => {
    return level * XP_PER_LEVEL;
};

const getXPProgress = (xp) => {
    const currentLevel = getUserLevel(xp);
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const xpInLevel = xp - currentLevelXP;
    const xpNeeded = nextLevelXP - currentLevelXP;
    return { xpInLevel, xpNeeded, percentage: Math.floor((xpInLevel / xpNeeded) * 100) };
};

module.exports = {
    name: 'givexp',
    description: 'Give XP to a user (Admin only)',
    
    execute: async (message, args) => {
        try {
            // Check admin permission
            if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return message.channel.send('❌ You need administrator permissions to use this command.');
            }

            // Get user and amount
            if (!args || !args[0] || !args[1]) {
                return message.channel.send('Usage: `/givexp <user> <amount>`');
            }

            let targetUser;
            try {
                targetUser = await message.client.users.fetch(args[0]);
            } catch (err) {
                return message.channel.send('❌ Could not find that user.');
            }

            const xpAmount = parseInt(args[1]);
            if (isNaN(xpAmount) || xpAmount <= 0) {
                return message.channel.send('❌ Please provide a valid XP amount.');
            }

            const xpData = getXPData();
            const oldXP = xpData[targetUser.id] || 0;
            const oldLevel = getUserLevel(oldXP);
            const newXP = oldXP + xpAmount;
            const newLevel = getUserLevel(newXP);

            xpData[targetUser.id] = newXP;
            saveXPData(xpData);

            const progress = getXPProgress(newXP);

            // Create confirmation embed
            const embed = new MessageEmbed()
                .setColor('#00FF00')
                .setTitle('✅ XP Given')
                .addFields(
                    { name: '👤 User', value: targetUser.username, inline: true },
                    { name: '✨ XP Given', value: `+${xpAmount.toLocaleString()}`, inline: true },
                    { name: '📊 New Total XP', value: newXP.toLocaleString(), inline: true },
                    { name: '📈 Level', value: `${oldLevel} → ${newLevel}`, inline: true },
                    { name: 'Progress', value: `${createProgressBar(progress.percentage)} ${progress.percentage}%`, inline: false }
                );

            if (newLevel > oldLevel) {
                embed.setDescription(`🎉 **${targetUser.username} leveled up to Level ${newLevel}!**`);
                embed.setColor('#FFD700');
            }

            message.channel.send(embed);
            log.info(`${message.author.tag} gave ${xpAmount} XP to ${targetUser.tag}`);

        } catch (error) {
            log.error('GiveXP command error:', error);
            message.channel.send('❌ An error occurred while giving XP.');
        }
    }
};

function createProgressBar(percentage) {
    const filled = Math.floor(percentage / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
