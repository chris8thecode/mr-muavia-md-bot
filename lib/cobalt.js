/**
 * Cobalt API client (v10) — unified downloader for TikTok / Instagram / Facebook.
 *
 * Cobalt (https://cobalt.tools) is an actively maintained open-source media
 * downloader. The official api.cobalt.tools instance now requires JWT auth, so
 * this client talks to free community instances instead.
 *
 * The instance list is configurable via the COBALT_INSTANCES env var
 * (comma-separated URLs) so the owner can point the bot at their own
 * self-hosted instance at any time. Instances are tried in order; if all fail,
 * the caller should fall back to its legacy sources.
 *
 * Verified working (no auth) as of 2026-09-29: https://rue-cobalt.xenon.zone
 * NOTE: community instances are run by volunteers and can go offline — that is
 * exactly why every command keeps its previous sources as fallbacks.
 */
const axios = require('axios');

const DEFAULT_INSTANCES = [
    'https://rue-cobalt.xenon.zone',
];

function getInstances() {
    const fromEnv = (process.env.COBALT_INSTANCES || '')
        .split(',')
        .map(s => s.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    return fromEnv.length ? fromEnv : DEFAULT_INSTANCES;
}

function guessType(url) {
    if (/\.(mp3|m4a|ogg|opus|wav)(\?|$)/i.test(url || '')) return 'audio';
    if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url || '')) return 'image';
    return 'video'; // cobalt redirect/tunnel responses are video downloads
}

/**
 * Ask Cobalt for downloadable media URLs.
 * @param {string} url  The TikTok / Instagram / Facebook post URL.
 * @returns {Promise<Array<{url:string,type:'video'|'image'|'audio'}>>}
 * @throws when every configured instance fails.
 */
async function cobaltFetch(url) {
    const instances = getInstances();
    let lastError = null;

    for (const base of instances) {
        try {
            const res = await axios.post(
                base,
                { url },
                {
                    timeout: 25000,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    validateStatus: s => s >= 200 && s < 500,
                }
            );

            const data = res.data;
            if (!data || typeof data !== 'object') throw new Error('invalid response');
            if (data.status === 'error') {
                throw new Error('cobalt error: ' + (data.error && data.error.code ? data.error.code : 'unknown'));
            }

            const media = [];
            if ((data.status === 'redirect' || data.status === 'tunnel') && data.url) {
                media.push({ url: data.url, type: guessType(data.url) });
            } else if (data.status === 'picker' && Array.isArray(data.picker)) {
                for (const item of data.picker) {
                    if (item && item.url) {
                        media.push({ url: item.url, type: item.type === 'video' ? 'video' : 'image' });
                    }
                }
            }

            // Dedupe, keep order
            const seen = new Set();
            const unique = media.filter(m => {
                if (!m.url || seen.has(m.url)) return false;
                seen.add(m.url);
                return true;
            });

            if (unique.length > 0) return unique;
            throw new Error('no media in response');
        } catch (err) {
            lastError = err;
            console.error(`[cobalt] instance ${base} failed:`, err.message);
        }
    }

    throw lastError || new Error('all cobalt instances failed');
}

module.exports = { cobaltFetch, getInstances };
