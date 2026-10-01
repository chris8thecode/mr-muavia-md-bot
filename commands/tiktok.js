const settings = require('../settings');
const { trySources, tiktokSources, sendVideoSmart } = require('../lib/fallbackDownload');

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

        // Fallback chain: cobalt -> tikwm (first working source wins)
        const { name, media } = await trySources(query, tiktokSources());
        const video = media.find(m => m.type === 'video') || media[0];
        if (!video || !video.url) throw new Error('no video url from ' + name);

        // Smart send: direct URL first, server-side download as fallback
        await sendVideoSmart(
            sock, from, msg, video.url,
            `✅ TIKTOK DOWNLOADED BY ${settings.botName.toUpperCase()}`
        );
    } catch (e) {
        console.error('TikTok command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Could not download that TikTok video. It may be private, region-locked, or the link is invalid.' }, { quoted: msg });
    }
}

module.exports = tiktokCommand;
