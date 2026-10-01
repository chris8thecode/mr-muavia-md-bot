const TRUTHS = [
    'What is your biggest fear?',
    'What is the most embarrassing thing you have ever done?',
    'Have you ever lied to your best friend? What about?',
    'What is one secret you have never told anyone?',
    'Who was your first crush?',
    'What is the worst gift you have ever received?',
    'Have you ever cheated in a game? Which one?',
    'What is something you pretend to like but secretly hate?',
    'What is your most useless talent?',
    'If you could change one thing about yourself, what would it be?',
    'What is the longest you have gone without showering?',
    'Have you ever talked to yourself in the mirror?',
    'What is a lie you told as a kid that got out of hand?',
    'Who in this group would you trust with your phone password?',
    'What is the weirdest dream you remember?'
];

async function truthCommand(sock, from, msg) {
    const t = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await sock.sendMessage(from, { text: `😇 *Truth*\n\n❓ ${t}` }, { quoted: msg });
}
module.exports = truthCommand;
