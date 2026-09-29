/**
 * Backward-compatible wrapper around lib/channel.js.
 * `channelInfo` used to be a static object with a hardcoded (and stale) newsletter
 * JID/name. It is now an async getter so the channel badge always reflects the
 * live, resolved channel instead of fabricated/old data.
 *
 * Old usage:   await sock.sendMessage(chatId, { text, ...channelInfo })
 * New usage:   await sock.sendMessage(chatId, { text, ...(await getChannelInfo(sock)) })
 */
const { getChannelContextInfo } = require('./channel');

async function getChannelInfo(sock) {
    return getChannelContextInfo(sock);
}

module.exports = { getChannelInfo };
