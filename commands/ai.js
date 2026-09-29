// AI on/off is persisted per-session in botData.aiSettings[userId] so it survives restarts,
// in addition to the in-memory session.aiEnabled flag used for fast per-message checks.
async function aiCommand(sock, from, msg, isAdmin, session, args, botData, saveBotData) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });

    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        session.aiEnabled = true;
        if (botData) {
            if (!botData.aiSettings) botData.aiSettings = {};
            botData.aiSettings[session.userId] = true;
            if (saveBotData) saveBotData();
        }
        if (!process.env.OPENAI_API_KEY) {
            await sock.sendMessage(from, { text: "⚠️ AI Auto-Reply Enabled, but OPENAI_API_KEY is not configured yet - replies will show a configuration error until it's set." }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { text: "✅ AI Auto-Reply Enabled!" }, { quoted: msg });
        }
    } else if (action === 'off') {
        session.aiEnabled = false;
        if (botData) {
            if (!botData.aiSettings) botData.aiSettings = {};
            botData.aiSettings[session.userId] = false;
            if (saveBotData) saveBotData();
        }
        await sock.sendMessage(from, { text: "❌ AI Auto-Reply Disabled!" }, { quoted: msg });
    } else if (args.length > 0) {
        // Direct query to AI
        const query = args.join(' ');
        if (!process.env.OPENAI_API_KEY) {
            return await sock.sendMessage(from, { text: "❌ AI is not configured. Ask the bot owner to set OPENAI_API_KEY in the environment." }, { quoted: msg });
        }
        try {
            await sock.sendMessage(from, { react: { text: '🤖', key: msg.key } });
            const response = await session.getAIResponse(from, query);
            await sock.sendMessage(from, { text: response }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(from, { text: "❌ AI Error: " + e.message }, { quoted: msg });
        }
    } else {
        await sock.sendMessage(from, { text: "❌ Usage:\n.ai [on/off] - Toggle Auto-Reply\n.ai [query] - Ask AI something" }, { quoted: msg });
    }
}

module.exports = aiCommand;
