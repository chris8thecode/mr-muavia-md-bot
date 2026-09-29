async function tagCommand(sock, from, msg, isAdmin, q) {
    if (!from.endsWith('@g.us') || !isAdmin) {
        return await sock.sendMessage(from, { text: '❌ Only admins can use this command in groups.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const participants = groupMetadata.participants.map(p => p.id);
        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (quotedMessage) {
            // Re-send the quoted message content while mentioning everyone, so it
            // shows up as a normal quoted reply visible to the whole group.
            await sock.sendMessage(from, {
                forward: {
                    key: {
                        remoteJid: from,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    },
                    message: quotedMessage
                },
                mentions: participants
            });
        } else {
            await sock.sendMessage(from, { text: q || '📢 Tag', mentions: participants }, { quoted: msg });
        }
    } catch (e) {
        console.error('Tag command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to tag members.' }, { quoted: msg });
    }
}

async function tagadminsCommand(sock, from, msg, isAdmin, q) {
    if (!from.endsWith('@g.us') || !isAdmin) {
        return await sock.sendMessage(from, { text: '❌ Only admins can use this command in groups.' }, { quoted: msg });
    }

    try {
        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants.filter(p => p.admin);

        if (admins.length === 0) {
            return await sock.sendMessage(from, { text: 'No admins found in this group.' }, { quoted: msg });
        }

        let text = `📢 *ADMINS*\n\n*Message:* ${q || 'No message'}\n\n`;
        for (const admin of admins) text += `🔹 @${admin.id.split('@')[0]}\n`;

        await sock.sendMessage(from, { text, mentions: admins.map(a => a.id) }, { quoted: msg });
    } catch (e) {
        console.error('Tagadmins command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to tag admins.' }, { quoted: msg });
    }
}

async function deleteMsgCommand(sock, from, msg, isAdmin) {
    if (!from.endsWith('@g.us') || !isAdmin) {
        return await sock.sendMessage(from, { text: '❌ Only admins can use this command in groups.' }, { quoted: msg });
    }

    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedId = contextInfo?.stanzaId;
    const quotedParticipant = contextInfo?.participant;

    if (!quotedId) {
        return await sock.sendMessage(from, { text: '❌ Reply to the message you want to delete with .delete' }, { quoted: msg });
    }

    try {
        await sock.sendMessage(from, {
            delete: {
                remoteJid: from,
                fromMe: false,
                id: quotedId,
                participant: quotedParticipant
            }
        });
    } catch (e) {
        console.error('Delete command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to delete that message. Make sure I am an admin.' }, { quoted: msg });
    }
}

module.exports = { tagCommand, tagadminsCommand, deleteMsgCommand };
