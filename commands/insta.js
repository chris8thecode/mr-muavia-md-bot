const axios = require('axios');
let igdl;
try {
    ({ igdl } = require('ruhend-scraper'));
} catch (e) {
    igdl = null; // ruhend-scraper missing/broken - source is skipped, not fatal
}

const AXIOS_DEFAULTS = {
    timeout: 20000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

const MAX_ITEMS = 5;           // don't flood the chat on multi-image posts
const MAX_MEDIA_BYTES = 60 * 1024 * 1024; // 60MB safety cap per item

const INSTAGRAM_URL_PATTERN = /https?:\/\/(?:www\.)?(?:instagram\.com|instagr\.am)\//i;

function dedupeMedia(items) {
    const seen = new Set();
    const out = [];
    for (const item of items) {
        if (!item || !item.url || seen.has(item.url)) continue;
        seen.add(item.url);
        out.push(item);
    }
    return out;
}

// Source 1: ruhend-scraper (already a project dependency, no external API key needed)
async function fetchWithRuhend(url) {
    if (!igdl) throw new Error('ruhend-scraper unavailable');
    const result = await igdl(url);
    if (!result || !Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('ruhend-scraper returned no media');
    }
    return result.data.map(m => ({
        url: m.url,
        type: m.type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(m.url || '') ? 'video' : 'image'
    }));
}

// Source 2: Vreden public API (fallback)
async function fetchWithVreden(url) {
    const apiUrl = `https://api.vreden.my.id/api/igdownload?url=${encodeURIComponent(url)}`;
    const res = await axios.get(apiUrl, AXIOS_DEFAULTS);
    if (!res?.data?.status || !Array.isArray(res.data.result) || res.data.result.length === 0) {
        throw new Error('Vreden returned no media');
    }
    return res.data.result.map(m => ({
        url: m.url,
        type: m.type === 'video' ? 'video' : 'image'
    }));
}

async function instaCommand(sock, from, msg, q) {
    const query = (q || '').trim();

    if (!query) {
        return await sock.sendMessage(from, { text: '❌ Please provide an Instagram URL.\nExample: .insta https://www.instagram.com/reel/...' }, { quoted: msg });
    }
    if (!INSTAGRAM_URL_PATTERN.test(query)) {
        return await sock.sendMessage(from, { text: "❌ That doesn't look like a valid Instagram link." }, { quoted: msg });
    }

    try {
        const loadEmojis = ['📥', '⏳', '📸'];
        for (const emoji of loadEmojis) {
            await sock.sendMessage(from, { react: { text: emoji, key: msg.key } });
        }

        const sources = [
            { name: 'ruhend-scraper', run: () => fetchWithRuhend(query) },
            { name: 'Vreden', run: () => fetchWithVreden(query) }
        ];

        let media = null;
        let lastError;
        for (const source of sources) {
            try {
                media = dedupeMedia(await source.run());
                if (media.length > 0) break;
            } catch (err) {
                lastError = err;
                console.error(`Instagram source "${source.name}" failed:`, err.message);
            }
        }

        if (!media || media.length === 0) {
            throw lastError || new Error('No media found');
        }

        const toSend = media.slice(0, MAX_ITEMS);
        let sentAny = false;

        for (const item of toSend) {
            try {
                // HEAD-check size where possible so we don't try to push huge files into WhatsApp
                try {
                    const head = await axios.head(item.url, { timeout: 10000 });
                    const len = parseInt(head.headers['content-length'] || '0', 10);
                    if (len > MAX_MEDIA_BYTES) {
                        console.log(`Skipping oversized Instagram media (${len} bytes): ${item.url}`);
                        continue;
                    }
                } catch (e) {
                    // Some CDNs reject HEAD requests - fall through and try sending anyway
                }

                if (item.type === 'video') {
                    await sock.sendMessage(from, { video: { url: item.url }, caption: '✅ Instagram Video' }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { image: { url: item.url }, caption: '✅ Instagram Image' }, { quoted: msg });
                }
                sentAny = true;
            } catch (sendErr) {
                console.error('Failed to send Instagram media item:', sendErr.message);
            }
        }

        if (!sentAny) {
            await sock.sendMessage(from, { text: '❌ Found the post but could not deliver the media (files may be too large or the CDN link expired). Try again in a moment.' }, { quoted: msg });
        }
    } catch (e) {
        console.error('Instagram command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Could not download that Instagram link. Make sure the post is public, then try again.' }, { quoted: msg });
    }
}

module.exports = instaCommand;
