const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');
const log = require('cat-loggr');

// XP system constants
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
    name: 'levels',
    description: 'Check your current level and XP',
    
    execute: async (message, args) => {
        try {
            const xpData = getXPData();
            const userId = args && args[0] ? args[0] : message.author.id;
            
            let targetUser;
            try {
                targetUser = await message.client.users.fetch(userId);
            } catch (err) {
                return message.channel.send('Could not find that user.');
            }

            const userXP = xpData[userId] || 0;
            const userLevel = getUserLevel(userXP);
            const progress = getXPProgress(userXP);

            // Create a nice embed with banner
            const levelEmbed = new MessageEmbed()
                .setColor('#FFD700') // Gold color
                .setTitle('⭐ LEVEL SYSTEM')
                .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: '📊 Level', value: `${userLevel}`, inline: true },
                    { name: '💫 Total XP', value: `${userXP.toLocaleString()}`, inline: true },
                    { name: '⏳ Next Level', value: `${progress.xpInLevel}/${progress.xpNeeded} XP`, inline: true }
                )
                .setDescription(`${createProgressBar(progress.percentage)} **${progress.percentage}%**`)
                    .setFooter({ text: 'XP = 1000 per level', iconURL: message.client.user.displayAvatarURL() })
                .setTimestamp();

            message.channel.send(levelEmbed);
        } catch (error) {
            log.error('Levels command error:', error);
            message.channel.send('An error occurred while fetching level information.');
        }
    }
};

function createProgressBar(percentage) {
    const filled = Math.floor(percentage / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
