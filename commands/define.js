const axios = require('axios');

async function defineCommand(sock, from, msg, q) {
    const word = (q || '').trim().split(/\s+/)[0];
    if (!word) {
        return await sock.sendMessage(from, { text: '❌ Usage: .define <word>\nExample: .define serendipity' }, { quoted: msg });
    }
    try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 25000 });
        const entry = res.data && res.data[0];
        if (!entry) throw new Error('no entry');
        const lines = [`📖 *Dictionary*\n\n*${entry.word}*`];
        if (entry.phonetic) lines.push(`🔊 ${entry.phonetic}`);
        let shown = 0;
        for (const meaning of (entry.meanings || []).slice(0, 3)) {
            const def = meaning.definitions && meaning.definitions[0];
            if (!def) continue;
            lines.push(`\n*${meaning.partOfSpeech || '—'}:* ${def.definition}`);
            if (def.example) lines.push(`💬 _"${def.example}"_`);
            if (++shown >= 3) break;
        }
        await sock.sendMessage(from, { text: lines.join('\n') }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ No definition found for "${word}".` }, { quoted: msg });
    }
}
module.exports = defineCommand;
