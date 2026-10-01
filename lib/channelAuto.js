/**
 * Channel auto-follow + auto-react.
 *
 * When the bot connects, it automatically follows the bot's own WhatsApp
 * channel (resolved from settings.channelUrl via lib/channel.js), and it
 * reacts to every new post on that channel by itself.
 *
 * Toggles (env, default ON):
 *   CHANNEL_AUTO_FOLLOW=false  -> skip auto-follow
 *   CHANNEL_AUTO_REACT=false   -> skip auto-react
 */
const { resolveChannel } = require('./channel');

const REACT_EMOJIS = ['❤️', '🔥', '👍', '👏', '🎉', '😮', '💯', '🙏'];

const autoFollowOn = () => process.env.CHANNEL_AUTO_FOLLOW !== 'false';
const autoReactOn = () => process.env.CHANNEL_AUTO_REACT !== 'false';

/**
 * Follow the bot's own channel. Safe to call on every (re)connect —
 * failures (already following, network, etc.) are logged quietly.
 */
async function autoFollowChannel(sock, sendLog) {
    if (!autoFollowOn()) return;
    try {
        const channel = await resolveChannel(sock);
        if (!channel) return;
        if (typeof sock.newsletterFollow !== 'function') return;
        await sock.newsletterFollow(channel.jid);
        if (sendLog) sendLog(`Auto-followed channel: ${channel.name} ✅`, 'success');
    } catch (err) {
        // Already following / transient failure — never crash the bot over this
        if (sendLog) sendLog('Channel auto-follow skipped: ' + (err.message || err), 'warning');
    }
}

/**
 * React to a channel post. Returns true if the message was a post on the
 * bot's own channel (caller should then skip normal command processing).
 */
async function maybeReactToChannelPost(sock, msg, sendLog) {
    try {
        if (!autoReactOn()) return false;
        const from = (msg.key && msg.key.remoteJid) || '';
        if (!from.endsWith('@newsletter')) return false;

        const channel = await resolveChannel(sock);
        if (!channel || from !== channel.jid) return false;

        // Only react to real posts — ignore protocol/reaction noise
        const content = msg.message;
        if (!content) return false;
        const type = Object.keys(content)[0];
        if (!type || type === 'reactionMessage' || type === 'protocolMessage') return false;
        if (typeof sock.newsletterReactMessage !== 'function') return false;

        const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
        await sock.newsletterReactMessage(channel.jid, msg.key.id, emoji);
        if (sendLog) sendLog(`Reacted ${emoji} to channel post`, 'info');
        return true;
    } catch (err) {
        if (sendLog) sendLog('Channel auto-react failed: ' + (err.message || err), 'warning');
        return false;
    }
}

module.exports = { autoFollowChannel, maybeReactToChannelPost, REACT_EMOJIS };
