async function pollCommand(sock, from, msg, isAdmin, q) {
    if (from.endsWith('@g.us') && !isAdmin) {
        return await sock.sendMessage(from, { text: '❌ Only admins can create a poll in this group.' }, { quoted: msg });
    }

    // Usage: .poll Question? | Option 1 | Option 2 | Option 3
    const parts = (q || '').split('|').map(p => p.trim()).filter(Boolean);
    const question = parts[0];
    const options = parts.slice(1);

    if (!question || options.length < 2) {
        return await sock.sendMessage(from, { text: '❌ Usage: .poll Question? | Option 1 | Option 2 | Option 3\n(at least 2 options required)' }, { quoted: msg });
    }
    if (options.length > 12) {
        return await sock.sendMessage(from, { text: '❌ Too many options — WhatsApp allows a maximum of 12 poll options.' }, { quoted: msg });
    }

    try {
        await sock.sendMessage(from, {
            poll: {
                name: question,
                values: options,
                selectableCount: 1
            }
        }, { quoted: msg });
    } catch (e) {
        console.error('Poll command error:', e.message);
        await sock.sendMessage(from, { text: '❌ Failed to create the poll.' }, { quoted: msg });
    }
}

module.exports = pollCommand;
