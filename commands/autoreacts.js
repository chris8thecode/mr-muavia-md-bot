// Auto-react on/off is persisted per-session in botData.statusSettings[userId].autoReact so it
// survives restarts, matching how it's loaded in BotSession's constructor.
async function autoreactsCommand(sock, from, msg, isAdmin, session, args, botData, saveBotData) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });

    const action = args[0]?.toLowerCase();
    if (action === 'on') {
        session.autoReact = true;
        if (botData) {
            if (!botData.statusSettings[session.userId]) botData.statusSettings[session.userId] = {};
            botData.statusSettings[session.userId].autoReact = true;
            if (saveBotData) saveBotData();
        }
        await sock.sendMessage(from, { text: "✅ Auto-React Enabled!" }, { quoted: msg });
    } else if (action === 'off') {
        session.autoReact = false;
        if (botData) {
            if (!botData.statusSettings[session.userId]) botData.statusSettings[session.userId] = {};
            botData.statusSettings[session.userId].autoReact = false;
            if (saveBotData) saveBotData();
        }
        await sock.sendMessage(from, { text: "❌ Auto-React Disabled!" }, { quoted: msg });
    } else {
        await sock.sendMessage(from, { text: "❌ Usage: .autoreacts [on/off]" }, { quoted: msg });
    }
}

module.exports = autoreactsCommand;
