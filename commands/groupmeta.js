const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

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

async function updateGnameCommand(sock, from, msg, isAdmin, newName) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    const name = (newName || '').trim();
    if (!name) return await sock.sendMessage(from, { text: '❌ Usage: .updategname <new group name>' }, { quoted: msg });
    if (name.length > 100) return await sock.sendMessage(from, { text: '❌ Group name is too long (max 100 characters).' }, { quoted: msg });

    try {
        await sock.groupUpdateSubject(from, name);
        await sock.sendMessage(from, { text: `✅ Group name updated to: *${name}*` }, { quoted: msg });
    } catch (e) {
        console.error('Updategname command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to update group name. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function updateGdescCommand(sock, from, msg, isAdmin, newDesc) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;
    const desc = (newDesc || '').trim();
    if (!desc) return await sock.sendMessage(from, { text: '❌ Usage: .updategdesc <new group description>' }, { quoted: msg });
    if (desc.length > 512) return await sock.sendMessage(from, { text: '❌ Group description is too long (max 512 characters).' }, { quoted: msg });

    try {
        await sock.groupUpdateDescription(from, desc);
        await sock.sendMessage(from, { text: '✅ Group description updated.' }, { quoted: msg });
    } catch (e) {
        console.error('Updategdesc command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to update group description. Make sure I am an admin.' }, { quoted: msg });
    }
}

async function gcppCommand(sock, from, msg, isAdmin) {
    if (!(await requireGroupAdmin(sock, from, msg, isAdmin))) return;

    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const directImage = msg.message?.imageMessage;
    const imageMessage = directImage || quotedMessage?.imageMessage;

    if (!imageMessage) {
        return await sock.sendMessage(from, { text: '❌ Send an image with the caption .gcpp, or reply to an image with .gcpp.' }, { quoted: msg });
    }

    try {
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        if (buffer.length === 0) throw new Error('Downloaded image was empty');
        if (buffer.length > 5 * 1024 * 1024) {
            return await sock.sendMessage(from, { text: '❌ Image is too large (max 5MB). Try a smaller image.' }, { quoted: msg });
        }

        await sock.updateProfilePicture(from, buffer);
        await sock.sendMessage(from, { text: '✅ Group icon updated.' }, { quoted: msg });
    } catch (e) {
        console.error('Gcpp command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to update the group icon. Make sure I am an admin and the image is a valid format.' }, { quoted: msg });
    }
}

module.exports = { updateGnameCommand, updateGdescCommand, gcppCommand };
