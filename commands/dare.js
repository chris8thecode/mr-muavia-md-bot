const DARES = [
    'Send a voice note singing your favorite song for 10 seconds.',
    'Do 10 push-ups right now and say "done" here.',
    'Change your profile picture to something funny for 1 hour.',
    'Text "I love you" to the 3rd contact in your phone list.',
    'Speak in English only for the next 10 minutes in this chat.',
    'Send your last photo from your gallery here (no cheating!).',
    'Do your best dance move and describe it in words.',
    'Call a friend and say "the sky is falling" then hang up.',
    'Write your name with your elbow and send a photo.',
    'Praise the person above you with 3 genuine compliments.',
    'Eat a spoon of salt... okay just kidding — drink a full glass of water instead!',
    'Send a selfie making your funniest face.',
    'Let the group choose your status for today.',
    'Talk like a robot for your next 5 messages.',
    'Send "I am the funniest person alive" to your family group.'
];

async function dareCommand(sock, from, msg) {
    const d = DARES[Math.floor(Math.random() * DARES.length)];
    await sock.sendMessage(from, { text: `😈 *Dare*\n\n🔥 ${d}` }, { quoted: msg });
}
module.exports = dareCommand;
