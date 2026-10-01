const axios = require('axios');
const { trySources, instagramSources, sendVideoSmart, downloadToFile } = require('../lib/fallbackDownload');

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

        // Fallback chain: cobalt -> ruhend-scraper (first working source wins)
        const { name, media } = await trySources(query, instagramSources());
        const items = dedupeMedia(media);
        if (items.length === 0) throw new Error('no media from ' + name);

        const toSend = items.slice(0, MAX_ITEMS);
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
                    // Smart send: direct URL first, server-side download as fallback
                    await sendVideoSmart(sock, from, msg, item.url, '✅ Instagram Video');
                } else {
                    try {
                        await sock.sendMessage(from, { image: { url: item.url }, caption: '✅ Instagram Image' }, { quoted: msg });
                    } catch (imgErr) {
                        // Buffer fallback for images too
                        const tmp = require('path').join(process.cwd(), 'tmp', `ig_${Date.now()}.jpg`);
                        await downloadToFile(item.url, tmp);
                        await sock.sendMessage(from, { image: require('fs-extra').readFileSync(tmp), caption: '✅ Instagram Image' }, { quoted: msg });
                        require('fs-extra').remove(tmp).catch(() => {});
                    }
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
