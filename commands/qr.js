const axios = require('axios');

async function qrCommand(sock, from, msg, q) {
    const text = (q || '').trim();
    if (!text) {
        return await sock.sendMessage(from, { text: '❌ Usage: .qr <text or link>\nExample: .qr https://google.com' }, { quoted: msg });
    }
    if (text.length > 500) {
        return await sock.sendMessage(from, { text: '❌ Text too long (max 500 characters).' }, { quoted: msg });
    }
    try {
        const url = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(text)}`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
        await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `🔳 *QR Code*\n\n📝 \`${text.slice(0, 100)}\`` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Could not generate QR code. Try again.' }, { quoted: msg });
    }
}
module.exports = qrCommand;
