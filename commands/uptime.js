function fmt(s) {
    s = Math.floor(s);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600),
          m = Math.floor((s % 3600) / 60), sec = s % 60;
    const parts = [];
    if (d) parts.push(d + 'd');
    if (h) parts.push(h + 'h');
    if (m) parts.push(m + 'm');
    parts.push(sec + 's');
    return parts.join(' ');
}

async function uptimeCommand(sock, from, msg) {
    await sock.sendMessage(from, { text: `⏱️ *Bot Uptime*\n\n🟢 Running for: *${fmt(process.uptime())}*` }, { quoted: msg });
}
module.exports = uptimeCommand;
