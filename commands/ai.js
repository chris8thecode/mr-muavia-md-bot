// AI command with multi-provider fallback (no API key required).
//
// Providers (via lib/apiManager, health-tracked):
//   1. emmy-chat (free, no key)  2. pollinations (free, no key)  3. openai (if OPENAI_API_KEY set)
//
// .ai on/off  -> toggle auto-reply mode (owner/admin only), persisted per-session
// .ai [query] -> ask AI (everyone)
const apiManager = require('../lib/apiManager');

async function aiCommand(sock, from, msg, isAdmin, session, args, botData, saveBotData) {
    const action = args[0]?.toLowerCase();

    if (action === 'on' || action === 'off') {
        if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });
        const enabled = action === 'on';
        session.aiEnabled = enabled;
        if (botData) {
            if (!botData.aiSettings) botData.aiSettings = {};
            botData.aiSettings[session.userId] = enabled;
            if (saveBotData) saveBotData();
        }
        await sock.sendMessage(from, { text: enabled ? "✅ AI Auto-Reply Enabled!" : "❌ AI Auto-Reply Disabled!" }, { quoted: msg });
        return;
    }

    if (args.length > 0) {
        // Direct query to AI — works for everyone, no API key needed
        const query = args.join(' ');
        try {
            await sock.sendMessage(from, { react: { text: '🤖', key: msg.key } });
            const { provider, result } = await apiManager.ai(query, session);
            await sock.sendMessage(from, { text: result.text }, { quoted: msg });
        } catch (e) {
            console.error('AI command error:', e.message);
            await sock.sendMessage(from, { text: "❌ AI is temporarily unavailable. Please try again in a moment." }, { quoted: msg });
        }
        return;
    }

    await sock.sendMessage(from, { text: "❌ Usage:\n.ai [on/off] - Toggle Auto-Reply (owner)\n.ai [question] - Ask AI something" }, { quoted: msg });
}

module.exports = aiCommand;
