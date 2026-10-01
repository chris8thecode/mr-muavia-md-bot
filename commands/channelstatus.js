const settings = require('../settings');
const { resolveChannel } = require('../lib/channel');

async function channelstatusCommand(sock, from, msg) {
    const lines = ['📢 *Channel Status*', ''];
    lines.push(`🔗 URL: ${settings.channelUrl || '—'}`);

    let channel = null;
    try {
        channel = await resolveChannel(sock);
    } catch (e) {
        channel = null;
    }

    if (channel) {
        lines.push(`✅ Resolved: *${channel.name}*`);
        lines.push(`🆔 \`${channel.jid}\``);
    } else {
        lines.push('❌ Channel not resolved yet — bot will retry automatically.');
    }
    lines.push('');
    lines.push(`Auto-follow: ${process.env.CHANNEL_AUTO_FOLLOW !== 'false' ? 'ON ✅' : 'OFF ❌'}`);
    lines.push(`Auto-react: ${process.env.CHANNEL_AUTO_REACT !== 'false' ? 'ON ✅' : 'OFF ❌'}`);

    await sock.sendMessage(from, { text: lines.join('\n') }, { quoted: msg });
}
module.exports = channelstatusCommand;
