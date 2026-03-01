const { MessageEmbed } = require('discord.js');

// helper for the math game loop
async function playMath(message) {
    const filter = m => m.author.id === message.author.id;

    while (true) {
        const num1 = Math.floor(Math.random() * 100);
        const num2 = Math.floor(Math.random() * 100);
        const operators = ['+', '-', '*', '/'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let answer;
        if (operator === '+') answer = num1 + num2;
        else if (operator === '-') answer = num1 - num2;
        else if (operator === '*') answer = num1 * num2;
        else answer = num1 / num2;

        const embed = new MessageEmbed()
            .setColor('000000')
            .setTitle('🧮 Math Game')
            .setDescription(`Solve: **${num1} ${operator} ${num2}**`)
            .setFooter(message.author.tag, message.author.displayAvatarURL({ dynamic: true, size: 64 }))
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });

        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 }).catch(() => null);
        if (!collected) {
            await message.channel.send('⏲️ Time expired. Game over.');
            return;
        }

        const response = collected.first().content.trim();

        // check answer correctness
        if (!isNaN(response) && Number(response) === answer) {
            // correct answer: offer another question
            await message.channel.send('✅ Correct!  Are you ready for the next question? Please type "Yes" or "No".');
            const next = await message.channel.awaitMessages({ filter, max: 1, time: 60000 }).catch(() => null);
            if (!next || next.first().content.trim().toLowerCase() !== 'yes') {
                await message.channel.send('Thanks for playing!');
                return;
            }
            // user said yes, loop will continue
        } else {
            // incorrect answer: end game immediately
            await message.channel.send(`❌ Incorrect; the correct answer is **${answer}**. Game over.`);
            return;
        }
    }
}

module.exports = {
    name: 'games',
    description: 'Play games like Math or Roulette',
    
    async execute(message, args) {
        const game = args[0]?.toLowerCase();

        if (!game) {
            const embed = new MessageEmbed()
                .setColor('000000')
                .setTitle('🎮 Games')
                .setDescription('Choose a game to play!')
                .addFields({ name: 'Available Games', value: '• `math` - Solve math problems\n• `roulette` - Spin the roulette wheel', inline: true })
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            
            return message.channel.send({ embeds: [embed] });
        }

        if (game === 'math') {
            await playMath(message);
        } else if (game === 'roulette') {
            const result = Math.random() > 0.5 ? '🔴 RED' : '⚫ BLACK';
            const embed = new MessageEmbed()
                .setColor('000000')
                .setTitle('🎰 Roulette Spin')
                .setDescription(`Result: **${result}**`)
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            
            await message.channel.send({ embeds: [embed] });
        } else {
            const embed = new MessageEmbed()
                .setColor('000000')
                .setTitle('❌ Invalid Game')
                .setDescription('Available games: `math`, `roulette`')
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true, size: 64 }) })
                .setTimestamp();
            
            return message.channel.send({ embeds: [embed] });
        }
    }
};
