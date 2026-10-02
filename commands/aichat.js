/**
 * Per-chat Auto AI mode.
 *
 * .aion    -> enable auto-AI replies in this chat
 * .aioff   -> disable
 * .aiclear -> clear conversation memory for this chat
 *
 * - Default OFF everywhere.
 * - Settings + limited history persisted per-session in botData.aiChat[userId][chatId].
 * - Cooldown: max 1 auto-reply per 4s per chat (spam protection).
 * - History capped at 6 exchanges so memory never grows unbounded.
 * - Uses apiManager.ai() (free providers, no key needed).
 */
const apiManager = require('../lib/apiManager');

const COOLDOWN_MS = 4000;
const MAX_HISTORY = 6; // exchanges (user+bot pairs)

function getChatState(botData, userId, chatId) {
    if (!botData.aiChat) botData.aiChat = {};
    if (!botData.aiChat[userId]) botData.aiChat[userId] = {};
    if (!botData.aiChat[userId][chatId]) {
        botData.aiChat[userId][chatId] = { enabled: false, history: [], lastReply: 0 };
    }
    return botData.aiChat[userId][chatId];
}

function isEnabled(botData, userId, chatId) {
    return !!(botData.aiChat && botData.aiChat[userId] && botData.aiChat[userId][chatId] && botData.aiChat[userId][chatId].enabled);
}

async function aionCommand(sock, from, msg, isAdmin, botData, saveBotData, userId) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner/admin can enable Auto AI mode." }, { quoted: msg });
    const st = getChatState(botData, userId, from);
    st.enabled = true;
    saveBotData();
    await sock.sendMessage(from, { text: "✅ *Auto AI mode ON* for this chat.\nI will reply to messages automatically.\n.aioff to disable • .aiclear to clear memory" }, { quoted: msg });
}

async function aioffCommand(sock, from, msg, isAdmin, botData, saveBotData, userId) {
    if (!isAdmin) return await sock.sendMessage(from, { text: "❌ Only owner/admin can disable Auto AI mode." }, { quoted: msg });
    const st = getChatState(botData, userId, from);
    st.enabled = false;
    saveBotData();
    await sock.sendMessage(from, { text: "❌ *Auto AI mode OFF* for this chat." }, { quoted: msg });
}

async function aiclearCommand(sock, from, msg, botData, saveBotData, userId) {
    const st = getChatState(botData, userId, from);
    st.history = [];
    saveBotData();
    await sock.sendMessage(from, { text: "🧹 Conversation memory cleared for this chat." }, { quoted: msg });
}

// Called from the message flow for non-command text in chats where .aion is on.
async function handleAutoAI(sock, msg, from, text, botData, saveBotData, userId, session) {
    const st = getChatState(botData, userId, from);
    if (!st.enabled) return false;

    // Spam protection: cooldown per chat
    const now = Date.now();
    if (now - st.lastReply < COOLDOWN_MS) return true; // handled (silently skipped)
    st.lastReply = now;

    try {
        // Build prompt with limited history
        let prompt = text;
        if (st.history.length) {
            const convo = st.history
                .slice(-MAX_HISTORY * 2)
                .map((h) => `${h.role === 'user' ? 'User' : 'Bot'}: ${h.content}`)
                .join('\n');
            prompt = `Previous conversation:\n${convo}\n\nUser: ${text}\nReply naturally and concisely.`;
        }
        const { result } = await apiManager.ai(prompt, session);
        const reply = result.text;

        // Save to history (capped)
        st.history.push({ role: 'user', content: text.slice(0, 500) });
        st.history.push({ role: 'bot', content: reply.slice(0, 500) });
        if (st.history.length > MAX_HISTORY * 2) {
            st.history = st.history.slice(-MAX_HISTORY * 2);
        }
        saveBotData();

        await sock.sendMessage(from, { text: reply }, { quoted: msg });
    } catch (e) {
        console.error('AutoAI error:', e.message);
        // Silent fail — don't spam the chat on API errors
    }
    return true;
}

module.exports = { aionCommand, aioffCommand, aiclearCommand, handleAutoAI, isEnabled, getChatState };
