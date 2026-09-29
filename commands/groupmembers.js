const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { getTargetJids } = require('../lib/groupTargets');

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

async function getBotAdminState(sock, from) {
    const groupMetadata = await sock.groupMetadata(from);
    const botId = jidNormalizedUser(sock.user.id);
    const botParticipant = groupMetadata.participants.find(p => p.id === botId);
    const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
    return { groupMetadata, botId, botIsAdmin };
}

async function addCommand(sock, from, msg, isAdmin, args = []) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;

    const targets = getTargetJids(msg, args);
    if (targets.length === 0) {
        return await sock.sendMessage(from, { text: '❌ Provide the number to add.\nExample: .add 923001234567' }, { quoted: msg });
    }

    try {
        const { botIsAdmin } = await getBotAdminState(sock, from);
        if (!botIsAdmin) {
            return await sock.sendMessage(from, { text: '❌ I need to be a group admin to add members.' }, { quoted: msg });
        }

        const result = await sock.groupParticipantsUpdate(from, targets, 'add');
        const added = result.filter(r => r.status === '200').map(r => r.jid);
        const failed = result.filter(r => r.status !== '200');

        let text = added.length > 0 ? `✅ Added ${added.length} member${added.length > 1 ? 's' : ''}.` : '❌ Could not add any of the given numbers.';
        if (failed.length > 0) {
            text += `\n⚠️ ${failed.length} number${failed.length > 1 ? 's' : ''} could not be added directly (privacy settings may require them to join via invite link instead).`;
        }
        await sock.sendMessage(from, { text, mentions: added }, { quoted: msg });
    } catch (e) {
        console.error('Add command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to add member(s). Make sure I am an admin and the number is correct.' }, { quoted: msg });
    }
}

async function promoteCommand(sock, from, msg, isAdmin, args = []) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;

    const targets = getTargetJids(msg, args);
    if (targets.length === 0) {
        return await sock.sendMessage(from, { text: '❌ Reply to, mention, or provide the number of the person to promote.' }, { quoted: msg });
    }

    try {
        const { botIsAdmin } = await getBotAdminState(sock, from);
        if (!botIsAdmin) {
            return await sock.sendMessage(from, { text: '❌ I need to be a group admin to promote members.' }, { quoted: msg });
        }

        await sock.groupParticipantsUpdate(from, targets, 'promote');
        await sock.sendMessage(from, { text: `✅ Promoted ${targets.length} member${targets.length > 1 ? 's' : ''} to admin.`, mentions: targets }, { quoted: msg });
    } catch (e) {
        console.error('Promote command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to promote member(s). Make sure I am an admin.' }, { quoted: msg });
    }
}

async function demoteCommand(sock, from, msg, isAdmin, args = []) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;

    const targets = getTargetJids(msg, args);
    if (targets.length === 0) {
        return await sock.sendMessage(from, { text: '❌ Reply to, mention, or provide the number of the person to demote.' }, { quoted: msg });
    }

    try {
        const { botIsAdmin } = await getBotAdminState(sock, from);
        if (!botIsAdmin) {
            return await sock.sendMessage(from, { text: '❌ I need to be a group admin to demote members.' }, { quoted: msg });
        }

        await sock.groupParticipantsUpdate(from, targets, 'demote');
        await sock.sendMessage(from, { text: `✅ Demoted ${targets.length} member${targets.length > 1 ? 's' : ''} from admin.`, mentions: targets }, { quoted: msg });
    } catch (e) {
        console.error('Demote command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to demote member(s). Make sure I am an admin.' }, { quoted: msg });
    }
}

module.exports = { addCommand, promoteCommand, demoteCommand };
