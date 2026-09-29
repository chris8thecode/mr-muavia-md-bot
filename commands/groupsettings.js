// Group-settings commands built on Baileys' native groupSettingUpdate,
// which is the same mechanism WhatsApp's own "Group settings" screen uses -
// no message-filtering hacks needed.

async function requireGroupAdmin(sock, from, msg, isAdmin) {
    if (!from.endsWith('@g.us')) {
        await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
        return false;
    }
    if (!isAdmin) {
        await sock.sendMessage(from, { text: '❌ Only admins can use this command.' }, { quoted: msg });
        return false;
    }
    return true;
}

async function muteCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        await sock.groupSettingUpdate(from, 'announcement');
        await sock.sendMessage(from, { text: '🔇 Group muted — only admins can send messages now.' }, { quoted: msg });
    } catch (e) {
        console.error('Mute command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to mute the group. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function unmuteCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        await sock.groupSettingUpdate(from, 'not_announcement');
        await sock.sendMessage(from, { text: '🔊 Group unmuted — everyone can send messages again.' }, { quoted: msg });
    } catch (e) {
        console.error('Unmute command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to unmute the group. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function lockgcCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        await sock.groupSettingUpdate(from, 'locked');
        await sock.sendMessage(from, { text: '🔒 Group locked — only admins can edit the group name, icon, and description now.' }, { quoted: msg });
    } catch (e) {
        console.error('Lockgc command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to lock the group. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function unlockgcCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        await sock.groupSettingUpdate(from, 'unlocked');
        await sock.sendMessage(from, { text: '🔓 Group unlocked — all members can edit the group info again.' }, { quoted: msg });
    } catch (e) {
        console.error('Unlockgc command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to unlock the group. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function groupstatusCommand(sock, from, msg, isAdmin, botData) {
    if (!from.endsWith('@g.us')) {
        return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    try {
        const metadata = await sock.groupMetadata(from);
        const antilinkMode = botData?.antilinkGroups?.[from];
        const antistatus = botData?.antiStatusGroups?.[from];

        const text = `📊 *GROUP STATUS*\n\n` +
            `🔖 Name: ${metadata.subject}\n` +
            `👥 Members: ${metadata.participants.length}\n` +
            `📢 Messaging: ${metadata.announce ? 'Admins only (muted)' : 'Everyone'}\n` +
            `🔐 Group edits: ${metadata.restrict ? 'Admins only (locked)' : 'Everyone'}\n` +
            `🔗 Anti-Link: ${antilinkMode ? `Enabled (${antilinkMode})` : 'Disabled'}\n` +
            `🚫 Anti-Status: ${antistatus ? 'Enabled' : 'Disabled'}\n` +
            `📌 Description set: ${metadata.desc ? 'Yes' : 'No'}`;

        await sock.sendMessage(from, { text }, { quoted: msg });
    } catch (e) {
        console.error('Groupstatus command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to fetch group status.' }, { quoted: msg });
    }
}

module.exports = { muteCommand, unmuteCommand, lockgcCommand, unlockgcCommand, groupstatusCommand };
