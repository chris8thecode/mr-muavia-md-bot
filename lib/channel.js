/**
 * Resolves the bot's WhatsApp Channel (newsletter) JID from its public invite URL
 * using Baileys' own channel/newsletter API. The JID is NEVER hardcoded or guessed -
 * it is looked up at runtime and cached in memory for the life of the process.
 *
 * If the installed Baileys version doesn't expose the newsletter API, or the lookup
 * fails for any reason (network, invalid link, rate limit, etc.), every function here
 * fails safe: it returns null / an empty object so callers can carry on without the
 * channel badge instead of crashing the bot.
 */
const settings = require('../settings');

let cachedChannel = null;   // { jid, name } once resolved
let resolveFailed = false;  // true once we've given up (avoid hammering on every message)
let inFlight = null;

function extractInviteCode(url) {
    if (!url) return null;
    const match = String(url).match(/whatsapp\.com\/channel\/([A-Za-z0-9]+)/i);
    return match ? match[1] : null;
}

async function resolveChannel(sock) {
    if (cachedChannel) return cachedChannel;
    if (resolveFailed) return null;
    if (inFlight) return inFlight;

    inFlight = (async () => {
        try {
            const inviteCode = extractInviteCode(settings.channelUrl);
            if (!inviteCode) {
                console.warn('[Channel] CHANNEL_URL is not a valid whatsapp.com/channel/... link. Skipping channel badge.');
                resolveFailed = true;
                return null;
            }
            if (!sock || typeof sock.newsletterMetadata !== 'function') {
                console.warn('[Channel] This Baileys version does not expose newsletterMetadata(); skipping channel badge.');
                resolveFailed = true;
                return null;
            }

            const metadata = await sock.newsletterMetadata('invite', inviteCode);
            if (metadata && metadata.id) {
                cachedChannel = { jid: metadata.id, name: metadata.name || settings.botName };
                return cachedChannel;
            }

            console.warn('[Channel] Could not resolve channel metadata from invite link.');
            resolveFailed = true;
            return null;
        } catch (err) {
            console.error('[Channel] Failed to resolve WhatsApp channel:', err.message || err);
            resolveFailed = true;
            return null;
        } finally {
            inFlight = null;
        }
    })();

    return inFlight;
}

/**
 * Returns a ready-to-spread message payload fragment (contextInfo with the
 * "forwarded from channel" badge), or {} if the channel couldn't be resolved.
 * Usage: sock.sendMessage(chatId, { text, ...(await getChannelContextInfo(sock)) })
 */
async function getChannelContextInfo(sock) {
    const channel = await resolveChannel(sock);
    if (!channel) return {};
    return {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: channel.jid,
                newsletterName: channel.name,
                serverMessageId: -1
            }
        }
    };
}

module.exports = { getChannelContextInfo, resolveChannel, extractInviteCode };
