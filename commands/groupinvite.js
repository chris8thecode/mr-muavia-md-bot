const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { onlyDigits } = require('../lib/groupTargets');

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

async function linkCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        const code = await sock.groupInviteCode(from);
        await sock.sendMessage(from, { text: `🔗 Group invite link:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch (e) {
        console.error('Link command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to get the group invite link. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function revokeCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    try {
        const code = await sock.groupRevokeInvite(from);
        await sock.sendMessage(from, { text: `♻️ Invite link reset. Old links no longer work.\n\nNew link:\nhttps://chat.whatsapp.com/${code}` }, { quoted: msg });
    } catch (e) {
        console.error('Revoke command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to reset the invite link. Make sure I am an admin.' }, { quoted: msg });
    }
}

// Owner-only: the bot account joins an external group via an invite link
async function joinCommand(sock, from, msg, isOwner, q) {
    if (!isOwner) return await sock.sendMessage(from, { text: '❌ Only the bot owner can use this command.' }, { quoted: msg });

    const link = (q || '').trim();
    const match = link.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!match) {
        return await sock.sendMessage(from, { text: '❌ Usage: .join <https://chat.whatsapp.com/invite-code>' }, { quoted: msg });
    }

    try {
        const response = await sock.groupAcceptInvite(match[1]);
        await sock.sendMessage(from, { text: `✅ Joined the group successfully.${response ? `\n🆔 ${response}` : ''}` }, { quoted: msg });
    } catch (e) {
        console.error('Join command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to join that group. The link may be invalid, expired, or the group may be full.' }, { quoted: msg });
    }
}

// Owner-only: creates a brand new group with the bot as the creator
async function newgcCommand(sock, from, msg, isOwner, q) {
    if (!isOwner) return await sock.sendMessage(from, { text: '❌ Only the bot owner can use this command.' }, { quoted: msg });

    // Usage: .newgc GroupName | 923001234567,923009876543
    const [namePart, numbersPart] = (q || '').split('|');
    const name = (namePart || '').trim();
    if (!name) {
        return await sock.sendMessage(from, { text: '❌ Usage: .newgc <group name> | <number1,number2,...>' }, { quoted: msg });
    }

    const participants = (numbersPart || '')
        .split(',')
        .map(onlyDigits)
        .filter(n => n.length >= 8)
        .map(n => `${n}@s.whatsapp.net`);

    try {
        const group = await sock.groupCreate(name, participants);
        await sock.sendMessage(from, { text: `✅ Group created: *${name}*\n🆔 ${group.id}\n👥 Added ${participants.length} member(s).` }, { quoted: msg });
    } catch (e) {
        console.error('Newgc command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to create the group. Check that the numbers are valid WhatsApp accounts.' }, { quoted: msg });
    }
}

// Owner-only: the bot leaves the current group
async function outCommand(sock, from, msg, isOwner) {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isOwner) return await sock.sendMessage(from, { text: '❌ Only the bot owner can use this command.' }, { quoted: msg });

    try {
        await sock.sendMessage(from, { text: '👋 Leaving this group. Goodbye!' }, { quoted: msg });
        await sock.groupLeave(from);
    } catch (e) {
        console.error('Out command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to leave the group.' }, { quoted: msg });
    }
}

// Owner-only, destructive: removes every other member and leaves - effectively "ends" the group.
// Requires explicit ".end confirm" so it can never be triggered by accident.
async function endCommand(sock, from, msg, isOwner, q) {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isOwner) return await sock.sendMessage(from, { text: '❌ Only the bot owner can use this command.' }, { quoted: msg });

    if ((q || '').trim().toLowerCase() !== 'confirm') {
        return await sock.sendMessage(from, { text: '⚠️ This removes every other member from the group and leaves. This cannot be undone.\n\nTo proceed, send: .end confirm' }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const botId = jidNormalizedUser(sock.user.id);
        const others = groupMetadata.participants.map(p => p.id).filter(id => id !== botId);

        if (others.length > 0) {
            try {
                await sock.groupParticipantsUpdate(from, others, 'remove');
            } catch (removeErr) {
                console.error('End command: failed to remove some members:', removeErr.message);
            }
        }

        await sock.sendMessage(from, { text: '🛑 Group ended.' }, { quoted: msg });
        await sock.groupLeave(from);
    } catch (e) {
        console.error('End command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to end the group. Make sure I am an admin.' }, { quoted: msg });
    }
}

module.exports = { linkCommand, revokeCommand, joinCommand, newgcCommand, outCommand, endCommand };
