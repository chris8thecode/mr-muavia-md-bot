const axios = require('axios');
const settings = require('../settings');

const TIKTOK_URL_PATTERN = /https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\//i;

async function tiktokCommand(sock, from, msg, q) {
    const query = (q || '').trim();

    if (!query) {
        return await sock.sendMessage(from, { text: '❌ Please provide a TikTok URL.\nExample: .tiktok https://vt.tiktok.com/...' }, { quoted: msg });
    }
    if (!TIKTOK_URL_PATTERN.test(query)) {
        return await sock.sendMessage(from, { text: "❌ That doesn't look like a valid TikTok link." }, { quoted: msg });
    }

    try {
        const loadEmojis = ['📥', '⏳', '📱'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        }

        const res = await axios.get('https://tikwm.com/api/', {
            params: { url: query },
            timeout: 20000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        const videoUrl = res?.data?.data?.play;
        if (res?.data?.code !== 0 || !videoUrl) {
            throw new Error(res?.data?.msg || 'TikTok API returned no video');
        }

        await sock.sendMessage(from, { video: { url: videoUrl }, caption: `✅ TIKTOK DOWNLOADED BY ${settings.botName.toUpperCase()}` }, { quoted: msg });
    } catch (e) {
        console.error('TikTok command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Could not download that TikTok video. It may be private, region-locked, or the link is invalid.' }, { quoted: msg });
    }
}

module.exports = tiktokCommand;
