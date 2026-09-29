const { onlyDigits } = require('../lib/groupTargets');

async function acceptCommand(sock, from, msg, isAdmin, args = []) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    const targetDigits = onlyDigits((args || []).join(' '));

    try {
        const response = await sock.groupRequestParticipantsList(from);

        if (!response || response.length === 0) {
            return sock.sendMessage(from, { text: '✅ No pending join requests found in this group.' }, { quoted: msg });
        }

        // Accept a single specific request when a number is given
        if (targetDigits) {
            const match = response.find(p => p.jid.startsWith(targetDigits));
            if (!match) {
                return sock.sendMessage(from, { text: `❌ No pending request found for ${targetDigits}.` }, { quoted: msg });
            }
            await sock.groupRequestParticipantsUpdate(from, [match.jid], 'approve');
            return sock.sendMessage(from, { text: `✅ Approved join request for @${match.jid.split('@')[0]}.`, mentions: [match.jid] }, { quoted: msg });
        }

        // Otherwise accept every pending request
        await sock.sendMessage(from, { text: `⏳ Found ${response.length} pending request(s). Accepting all...` }, { quoted: msg });

        let acceptedCount = 0;
        for (const participant of response) {
            try {
                await sock.groupRequestParticipantsUpdate(from, [participant.jid], 'approve');
                acceptedCount++;
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (err) {
                console.error(`Failed to accept ${participant.jid}:`, err.message);
            }
        }

        await sock.sendMessage(from, { text: `✅ Accepted ${acceptedCount}/${response.length} pending request(s).` }, { quoted: msg });

    } catch (e) {
        console.error('Accept command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to process join requests. Make sure I am an admin.' }, { quoted: msg });
    }
}

module.exports = acceptCommand;
