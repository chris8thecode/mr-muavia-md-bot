async function antilinkCommand(sock, from, msg, isAdmin, botData, saveBotData, args, userId) {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ This command only works in groups.' }, { quoted: msg });
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only admins can use this command.' }, { quoted: msg });

    if (!botData.antilinkGroups) botData.antilinkGroups = {};
    if (!botData.antilinkGroups[userId]) botData.antilinkGroups[userId] = {};

    const mode = args[0]?.toLowerCase();
    if (mode === 'on') {
        botData.antilinkGroups[userId][from] = 'delete';
        saveBotData();
        return await sock.sendMessage(from, { text: '✅ Antilink enabled (delete mode).' }, { quoted: msg });
    } else if (mode === 'off') {
        delete botData.antilinkGroups[userId][from];
        saveBotData();
        return await sock.sendMessage(from, { text: '⏹️ Antilink disabled.' }, { quoted: msg });
    } else if (mode === 'kick') {
        botData.antilinkGroups[userId][from] = 'kick';
        saveBotData();
        return await sock.sendMessage(from, { text: '✅ Antilink enabled (kick mode).' }, { quoted: msg });
    } else {
        return await sock.sendMessage(from, { text: 'Usage: .antilink on/off/kick' }, { quoted: msg });
    }
}

module.exports = antilinkCommand;
