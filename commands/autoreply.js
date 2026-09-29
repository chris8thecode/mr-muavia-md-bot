// commands/autoreply.js
// Lightweight automatic replies (Salam, Hi, Thanks, etc.) - new feature, does not touch any
// existing command. Session-specific (per userId, via botData.autoReplySettings) and OFF by
// default so it never surprises an existing deployment.

// Case-insensitive, whole-message matching only (not substring), so a normal sentence that
// happens to contain "hi" or "help" doesn't get hijacked. Keys are lowercase; punctuation and
// surrounding whitespace are stripped before matching.
const REPLIES = {
    'salam': 'Wa Alaikum Assalam! 👋',
    'assalamualaikum': 'Wa Alaikum Assalam Wa Rahmatullah! ☺️',
    'walaikum assalam': 'Wa Alaikum Assalam! 😊',
    'hi': 'Hello! 👋 How can I help you today?',
    'hello': 'Hi there! 👋',
    'hey': 'Hey! What\'s up? 😄',
    'good morning': 'Good morning! ☀️ Have a wonderful day.',
    'good night': 'Good night! 🌙 Sleep well.',
    'good afternoon': 'Good afternoon! 😊',
    'good evening': 'Good evening! 🌆',
    'kya haal hai': 'Alhamdulillah, main theek hoon! Aap kaise hain? 😊',
    'kese ho': 'Main theek hoon, shukriya! Aap sunao? 😊',
    'kaise ho': 'Main theek hoon, shukriya! Aap sunao? 😊',
    'thanks': 'You\'re welcome! 😊',
    'thank you': 'You\'re most welcome! 🙌',
    'shukriya': 'Koi baat nahi! 😊',
    'love': '❤️ Sending some love your way too!',
    'shared': '🙏 Thanks for sharing!',
    'mashaallah': 'MashaAllah! ✨',
    'subhanallah': 'SubhanAllah! 🌟',
    'alhamdulillah': 'Alhamdulillah! 🤲',
    'inshaallah': 'InshaAllah! 🤲',
    'bhai': 'Ji bhai, kaise hain aap? 😊',
    'help': 'Type *.menu* to see everything I can do! 📋'
};

function normalize(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[!.?,؟]+$/g, '')
        .trim();
}

function isEnabledFor(botData, userId) {
    // Default OFF so existing deployments keep their current behavior until the owner opts in.
    return !!(botData?.autoReplySettings?.[userId]);
}

async function autoreplyCommand(sock, from, msg, isAdmin, botData, saveBotData, userId, args) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner can use this command." }, { quoted: msg });

    if (!botData.autoReplySettings) botData.autoReplySettings = {};
    const action = args[0]?.toLowerCase();

    if (action === 'on') {
        botData.autoReplySettings[userId] = true;
        saveBotData();
        await sock.sendMessage(from, { text: "✅ Auto-Reply (greetings) Enabled!" }, { quoted: msg });
    } else if (action === 'off') {
        botData.autoReplySettings[userId] = false;
        saveBotData();
        await sock.sendMessage(from, { text: "❌ Auto-Reply (greetings) Disabled!" }, { quoted: msg });
    } else {
        const enabled = isEnabledFor(botData, userId);
        await sock.sendMessage(from, { text: `❌ Usage: .autoreply [on/off]\nCurrent status: ${enabled ? '✅ Enabled' : '❌ Disabled'}` }, { quoted: msg });
    }
}

// Called from the main message handler. Returns true if it sent a reply (so the caller can
// avoid also treating the message as a command, etc).
// `repliedMessageIds` is the caller's per-session Set used for command-dedup already
// (this.processedMessages) - we reuse the same msgId check upstream, so this function itself
// does not need its own duplicate-tracking beyond "one lookup, one reply, no loop":
// it never replies to its own messages (isMe) or to status updates, and only ever replies once
// since it's invoked once per incoming message event.
async function handleAutoReply(sock, msg, botData, userId, text, isMe, isStatus) {
    try {
        if (isMe || isStatus) return false;
        if (!isEnabledFor(botData, userId)) return false;
        if (!text) return false;

        const key = normalize(text);
        const reply = REPLIES[key];
        if (!reply) return false;

        await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = autoreplyCommand;
module.exports.handleAutoReply = handleAutoReply;
module.exports.isEnabledFor = isEnabledFor;
module.exports.REPLIES = REPLIES;
