/**
 * .aiimage / .imagine [prompt] — AI image generation.
 *
 * Provider: Pollinations (free, no key required).
 * Usage: .aiimage a cute cat astronaut
 */
const axios = require('axios');

const TIMEOUT = 90000; // image gen can take a while

async function aiimageCommand(sock, from, msg, q) {
    const prompt = (q || '').trim();
    if (!prompt) {
        return await sock.sendMessage(from, {
            text: '❌ Please describe the image.\nExample: .aiimage a cute cat astronaut',
        }, { quoted: msg });
    }

    await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } });

    try {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        // Verify it's a real image before sending
        const head = await axios.head(url, { timeout: 30000, maxRedirects: 5 });
        const ctype = head.headers['content-type'] || '';
        if (!ctype.startsWith('image/')) throw new Error('not an image: ' + ctype);

        await sock.sendMessage(from, {
            image: { url },
            caption: `🎨 *${prompt.slice(0, 200)}*`,
        }, { quoted: msg });
    } catch (e) {
        console.error('aiimage error:', e.message);
        await sock.sendMessage(from, {
            text: '❌ Could not generate the image right now. Try again in a moment.',
        }, { quoted: msg });
    }
}

module.exports = aiimageCommand;
