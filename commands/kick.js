const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { getTargetJids } = require('../lib/groupTargets');

async function kickCommand(sock, from, msg, isAdmin, args = []) {
    if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    if (!isAdmin) return await sock.sendMessage(from, { text: '❌ Only admins can use this command.' }, { quoted: msg });

    const targets = getTargetJids(msg, args);
    if (targets.length === 0) {
        return await sock.sendMessage(from, { text: '❌ Reply to, mention, or provide the number of the person to kick.\nExample: .kick 923001234567' }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const botId = jidNormalizedUser(sock.user.id);
        const botParticipant = groupMetadata.participants.find(p => p.id === botId);
        const botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

        if (!botIsAdmin) {
            return await sock.sendMessage(from, { text: '❌ I need to be a group admin to remove members.' }, { quoted: msg });
        }

        const safeTargets = [];
        const skipped = [];
        for (const jid of targets) {
            if (jid === botId) { skipped.push('me (the bot)'); continue; }
            const participant = groupMetadata.participants.find(p => p.id === jid);
            if (participant && (participant.admin === 'admin' || participant.admin === 'superadmin')) {
                skipped.push(`@${jid.split('@')[0]} (group admin)`);
                continue;
            }
            safeTargets.push(jid);
        }

        if (safeTargets.length === 0) {
            return await sock.sendMessage(from, { text: `❌ Nothing to do — every target was skipped (${skipped.join(', ') || 'no valid targets'}).` }, { quoted: msg });
        }

        await sock.groupParticipantsUpdate(from, safeTargets, 'remove');

        let resultText = `✅ Removed ${safeTargets.length} member${safeTargets.length > 1 ? 's' : ''}.`;
        if (skipped.length > 0) resultText += `\n⚠️ Skipped: ${skipped.join(', ')}`;

        await sock.sendMessage(from, { text: resultText, mentions: safeTargets }, { quoted: msg });
    } catch (e) {
        console.error('Kick command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to remove member(s). Make sure I am an admin and the number is correct.' }, { quoted: msg });
    }
}

module.exports = kickCommand;
