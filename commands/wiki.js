const axios = require('axios');

async function wikiCommand(sock, from, msg, q) {
    const query = (q || '').trim();
    if (!query) {
        return await sock.sendMessage(from, { text: '❌ Usage: .wiki <topic>\nExample: .wiki Pakistan' }, { quoted: msg });
    }
    try {
        const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'MR-MUAVIA-MD-BOT/1.0' }
        });
        const d = res.data;
        if (!d || d.type === 'disambiguation' || !d.extract) {
            return await sock.sendMessage(from, { text: `❌ No Wikipedia article found for "${query}".` }, { quoted: msg });
        }
        let text = `📚 *Wikipedia*\n\n*${d.title}*\n\n${d.extract.slice(0, 900)}`;
        if (d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page) {
            text += `\n\n🔗 ${d.content_urls.desktop.page}`;
        }
        if (d.thumbnail && d.thumbnail.source) {
            await sock.sendMessage(from, { image: { url: d.thumbnail.source }, caption: text }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ Could not find "${query}" on Wikipedia.` }, { quoted: msg });
    }
}
module.exports = wikiCommand;
