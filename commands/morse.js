const MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
    G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
    M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....',
    '7': '--...', '8': '---..', '9': '----.', ' ': '/'
};
const REVERSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));

async function morseCommand(sock, from, msg, q) {
    const text = (q || '').trim();
    if (!text) {
        return await sock.sendMessage(from, { text: '❌ Usage: .morse <text>\nEncodes text, or decodes morse (.- /).' }, { quoted: msg });
    }
    let out;
    if (/^[.\- /]+$/.test(text)) {
        // decode
        out = text.trim().split(' / ').map(word =>
            word.split(' ').map(code => REVERSE[code] || '?').join('')
        ).join(' ');
        await sock.sendMessage(from, { text: `📡 *Morse Decoder*\n\n📥 Morse: \`${text}\`\n✅ Text: *${out}*` }, { quoted: msg });
    } else {
        // encode
        out = text.toUpperCase().split('').map(ch => MORSE[ch] || '?').join(' ');
        await sock.sendMessage(from, { text: `📡 *Morse Encoder*\n\n📝 Text: \`${text}\`\n✅ Morse: *${out}*` }, { quoted: msg });
    }
}
module.exports = morseCommand;
