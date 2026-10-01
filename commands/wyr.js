const WYR = [
    ['be able to fly', 'be invisible'],
    ['always be 10 minutes late', 'always be 20 minutes early'],
    ['have unlimited money', 'have unlimited time'],
    ['never use social media again', 'never watch movies again'],
    ['be famous', 'be rich but unknown'],
    ['live in the past', 'live in the future'],
    ['always speak your mind', 'never speak again'],
    ['have a rewind button', 'have a pause button for life'],
    ['be the funniest person alive', 'be the smartest person alive'],
    ['eat only pizza forever', 'eat only biryani forever'],
    ['know the date of your death', 'know the cause of your death'],
    ['be a genius in a boring world', 'be average in an exciting world']
];

async function wyrCommand(sock, from, msg) {
    const [a, b] = WYR[Math.floor(Math.random() * WYR.length)];
    await sock.sendMessage(from, { text: `🤔 *Would You Rather*\n\n🅰️ ${a}\n🅱️ ${b}\n\nReply with A or B!` }, { quoted: msg });
}
module.exports = wyrCommand;
