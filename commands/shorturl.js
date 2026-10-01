const axios = require('axios');

async function shorturlCommand(sock, from, msg, q) {
    const url = (q || '').trim();
    if (!url) {
        return await sock.sendMessage(from, { text: '❌ Usage: .shorturl <link>\nExample: .shorturl https://google.com' }, { quoted: msg });
    }
    if (!/^https?:\/\//i.test(url)) {
        return await sock.sendMessage(from, { text: '❌ That is not a valid link (must start with http).' }, { quoted: msg });
    }
    try {
        const res = await axios.get(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { timeout: 15000 });
        const short = (res.data || '').toString().trim();
        if (!short.startsWith('http')) throw new Error('bad response');
        await sock.sendMessage(from, { text: `🔗 *URL Shortener*\n\n📎 Original: ${url}\n✨ Short: *${short}*` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not shorten that link. Try again.' }, { quoted: msg });
    }
}
module.exports = shorturlCommand;
