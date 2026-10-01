const ANSWERS = [
    'It is certain. ✅', 'Without a doubt. ✅', 'Yes, definitely. ✅',
    'You may rely on it. ✅', 'As I see it, yes. ✅', 'Most likely. ✅',
    'Outlook good. ✅', 'Yes. ✅', 'Signs point to yes. ✅',
    'Reply hazy, try again. 🔄', 'Ask again later. 🔄', 'Cannot predict now. 🔄',
    'Concentrate and ask again. 🔄', "Don't count on it. ❌", 'My reply is no. ❌',
    'My sources say no. ❌', 'Outlook not so good. ❌', 'Very doubtful. ❌'
];

async function eightBallCommand(sock, from, msg, q) {
    const question = (q || '').trim();
    if (!question) {
        return await sock.sendMessage(from, { text: '❌ Ask me something!\nExample: .8ball Will I be rich?' }, { quoted: msg });
    }
    const answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
    await sock.sendMessage(from, { text: `🎱 *Magic 8-Ball*\n\n❓ Question: ${question}\n🔮 Answer: *${answer}*` }, { quoted: msg });
}
module.exports = eightBallCommand;
