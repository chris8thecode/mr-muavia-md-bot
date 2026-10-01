const RIDDLES = [
    ['I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', 'An echo'],
    ['The more of me you take, the more you leave behind. What am I?', 'Footsteps'],
    ['I have keys but no locks. I have space but no room. You can enter but not go outside. What am I?', 'A keyboard'],
    ['What has to be broken before you can use it?', 'An egg'],
    ['I am tall when I am young, and short when I am old. What am I?', 'A candle'],
    ['What runs but never walks, has a mouth but never talks?', 'A river'],
    ['The person who makes it sells it. The person who buys it never uses it. What is it?', 'A coffin'],
    ['What goes up but never comes down?', 'Your age'],
    ['I have a head and a tail but no body. What am I?', 'A coin'],
    ['What can fill a room but takes up no space?', 'Light'],
    ['Forward I am heavy, backward I am not. What am I?', 'The word "ton"'],
    ['What has many needles but never sews?', 'A Christmas tree']
];

async function riddleCommand(sock, from, msg) {
    const [q, a] = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    await sock.sendMessage(from, { text: `🧩 *Riddle*\n\n❓ ${q}\n\n||Tap to think... answer: *${a}*||` }, { quoted: msg });
}
module.exports = riddleCommand;
