// Shared helper for group-management commands: figures out which
// user(s) a command is targeting from a reply, an @mention, or a
// raw phone number typed as an argument.

function onlyDigits(s = '') {
    return String(s).replace(/\D/g, '');
}

/**
 * Resolve target JIDs for a command like .kick, .promote, .demote, .add.
 * Priority: quoted/replied message sender > @mentions in the message > raw numbers in args.
 * Returns an array of JIDs in `<digits>@s.whatsapp.net` form (never empty-string entries).
 */
function getTargetJids(msg, args = []) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo;
    const quotedParticipant = contextInfo?.participant;
    const mentioned = contextInfo?.mentionedJid || [];

    if (quotedParticipant) return [quotedParticipant];
    if (mentioned.length > 0) return mentioned;

    // Fall back to raw numbers typed after the command, e.g. ".add 923001234567"
    const numbers = args
        .join(' ')
        .split(/[\s,]+/)
        .map(onlyDigits)
        .filter(n => n.length >= 8); // reject obviously-invalid fragments

    return numbers.map(n => `${n}@s.whatsapp.net`);
}

module.exports = { getTargetJids, onlyDigits };
