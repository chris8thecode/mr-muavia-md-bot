// Per-group on/off switch for the bot. When a group is deactivated, the bot
// ignores every command in it except ".active on" from an admin/owner, so a
// group can always turn the bot back on.
async function activeCommand(sock, from, msg, isAdmin, botData, saveBotData, args = [], userId) {
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return await sock.sendMessage(from, { text: '❌ Only admins can use this command.' }, { quoted: msg });
    }

    const action = (args[0] || '').toLowerCase();
    if (!botData.inactiveGroups) botData.inactiveGroups = {};
    if (!botData.inactiveGroups[userId]) botData.inactiveGroups[userId] = {};

    if (action === 'on') {
        delete botData.inactiveGroups[userId][from];
        saveBotData();
        await sock.sendMessage(from, { text: '✅ Bot is now active in this group.' }, { quoted: msg });
    } else if (action === 'off') {
        botData.inactiveGroups[userId][from] = true;
        saveBotData();
        await sock.sendMessage(from, { text: '❌ Bot deactivated in this group. Send ".active on" to re-enable.' }, { quoted: msg });
    } else {
        const state = botData.inactiveGroups[userId]?.[from] ? 'inactive' : 'active';
        await sock.sendMessage(from, { text: `ℹ️ Bot is currently *${state}* in this group.\nUsage: .active [on/off]` }, { quoted: msg });
    }
}

module.exports = activeCommand;
