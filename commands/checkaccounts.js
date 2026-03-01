const { MessageEmbed, Permissions } = require('discord.js');
const fs = require('fs');
const path = require('path');
const log = require('cat-loggr');
const https = require('https');

module.exports = {
    name: 'checkaccounts',
    description: 'Check Minecraft accounts validity (Admin only)',
    
    execute: async (message, args) => {
        try {
            // Check admin permission
            if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
                return message.channel.send('❌ You need administrator permissions to use this command.');
            }

            // Get service argument
            if (!args || !args[0]) {
                return message.channel.send('Usage: `/checkaccounts <service>` (e.g., minecraft, fortnite)');
            }

            const service = args[0].toLowerCase();
            const stockFile = path.join(__dirname, `../stock/${service}.txt`);

            // Check if file exists
            if (!fs.existsSync(stockFile)) {
                return message.channel.send(`❌ No accounts found for **${service}**`);
            }

            // Read accounts
            const accounts = fs.readFileSync(stockFile, 'utf8')
                .split('\n')
                .filter(line => line.trim().length > 0);

            if (accounts.length === 0) {
                return message.channel.send(`❌ No accounts found for **${service}**`);
            }

            const startEmbed = new MessageEmbed()
                .setColor('#FFA500')
                .setTitle('🔍 Account Checker')
                .setDescription(`Checking **${accounts.length}** ${service} accounts...\nThis may take a minute...`)
                .setFooter('Checking in progress...');

            const statusMsg = await message.channel.send(startEmbed);

            let validCount = 0;
            let invalidCount = 0;
            const validAccounts = [];
            const invalidAccounts = [];

            // Check accounts in parallel with concurrency limit
            const concurrencyLimit = 10; // Check 10 at a time
            
            for (let i = 0; i < accounts.length; i += concurrencyLimit) {
                const batch = accounts.slice(i, i + concurrencyLimit);
                const results = await Promise.all(
                    batch.map(account => checkMinecraftAccount(account))
                );

                results.forEach((isValid, index) => {
                    const account = batch[index].trim();
                    if (isValid) {
                        validCount++;
                        validAccounts.push(account);
                    } else {
                        invalidCount++;
                        invalidAccounts.push(account);
                    }
                });

                // Update progress
                const progressEmbed = new MessageEmbed()
                    .setColor('#FFA500')
                    .setTitle('🔍 Account Checker')
                    .setDescription(`Checking **${accounts.length}** ${service} accounts...\nProgress: ${Math.min(i + concurrencyLimit, accounts.length)}/${accounts.length}`)
                    .addField('✅ Valid', validCount, true)
                    .addField('❌ Invalid', invalidCount, true)
                    .setFooter('Checking in progress...');
                
                await statusMsg.edit(progressEmbed).catch(() => {});
            }

            // Save results to file
            const resultsDir = path.join(__dirname, '../stock/check_results');
            if (!fs.existsSync(resultsDir)) {
                fs.mkdirSync(resultsDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const resultsFile = path.join(resultsDir, `${service}_check_${timestamp}.txt`);
            
            const resultsContent = `Account Check Results for ${service}\nChecked: ${new Date().toLocaleString()}\n\n=== VALID ACCOUNTS (${validCount}) ===\n${validAccounts.join('\n')}\n\n=== INVALID ACCOUNTS (${invalidCount}) ===\n${invalidAccounts.join('\n')}`;
            fs.writeFileSync(resultsFile, resultsContent);

            // Remove invalid accounts from stock file
            const validOnlyContent = validAccounts.join('\n');
            fs.writeFileSync(stockFile, validOnlyContent);

            // Final results embed
            const resultEmbed = new MessageEmbed()
                .setColor(validCount > 0 ? '#00FF00' : '#FF0000')
                .setTitle(`✅ Account Check Complete`)
                .addField('Service', service.toUpperCase(), true)
                .addField('Total Checked', accounts.length, true)
                .addField('✅ Valid', validCount, true)
                .addField('❌ Invalid', invalidCount, true)
                .addField('Validity Rate', `${Math.round((validCount / accounts.length) * 100)}%`, false)
                .setDescription(`**${validCount} valid accounts remain in stock**\n**${invalidCount} invalid accounts removed**`)
                .setFooter(`Results saved to: check_results/${path.basename(resultsFile)}`);

            await statusMsg.edit(resultEmbed).catch(() => {});
            log.info(`${message.author.tag} checked ${accounts.length} ${service} accounts. Valid: ${validCount}, Invalid: ${invalidCount}`);

        } catch (error) {
            console.error('Account checker error:', error);
            message.channel.send('❌ An error occurred while checking accounts.');
        }
    }
};

function checkMinecraftAccount(account) {
    return new Promise((resolve) => {
        // Parse account (supports format: username or username:password)
        const parts = account.includes(':') ? account.split(':') : [account];
        const username = parts[0].trim();

        if (!username || username.length === 0) {
            resolve(false);
            return;
        }

        // Use Microsoft's Minecraft API to check username validity
        const options = {
            hostname: 'api.minecraft.net',
            path: `/users/profiles/minecraft/${encodeURIComponent(username)}`,
            method: 'GET',
            timeout: 3000
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    // Status 200 = account exists and is valid
                    if (res.statusCode === 200) {
                        const json = JSON.parse(data);
                        resolve(json && json.id); // Has ID = valid account
                    } else {
                        resolve(false);
                    }
                } catch (err) {
                    resolve(false);
                }
            });
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}
