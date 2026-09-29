async function requestsCommand(sock, from, msg, isAdmin) {
    if (!from.endsWith('@g.us')) {
        return sock.sendMessage(from, { text: '❌ This command can only be used in groups.' }, { quoted: msg });
    }
    if (!isAdmin) {
        return sock.sendMessage(from, { text: '❌ Only group admins can use this command.' }, { quoted: msg });
    }

    try {
        const response = await sock.groupRequestParticipantsList(from);
        if (!response || response.length === 0) {
            return sock.sendMessage(from, { text: '✅ No pending join requests.' }, { quoted: msg });
        }

        const list = response.map((p, i) => `${i + 1}. @${p.jid.split('@')[0]}`).join('\n');
        await sock.sendMessage(from, {
            text: `📋 *PENDING JOIN REQUESTS (${response.length})*\n\n${list}\n\nUse *.accept <number>* or *.reject <number>* to act on one, or *.acceptall* / *.rejectall* for all of them.`,
            mentions: response.map(p => p.jid)
        }, { quoted: msg });
    } catch (e) {
        console.error('Requests command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to fetch join requests. Make sure I am an admin.' }, { quoted: msg });
    }
}

module.exports = requestsCommand;
