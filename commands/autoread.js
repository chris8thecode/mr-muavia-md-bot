/**
 * MR Muavia MD BOT - A WhatsApp Bot
 * Autoread Command - Automatically read all messages
 * Setting is isolated per session (userId) via botData.autoReadSettings, so one user's
 * bot instance turning this on/off never affects another session on the same deployment.
 */

const { getChannelInfo } = require('../lib/messageConfig');

function isAutoreadEnabledFor(botData, userId) {
    return !!(botData?.autoReadSettings?.[userId]);
}

// Toggle autoread feature for this session only
async function autoreadCommand(sock, chatId, message, isAdmin, botData, saveBotData, userId, args) {
    try {
        const channelInfo = await getChannelInfo(sock);

        if (!isAdmin) {
            await sock.sendMessage(chatId, {
                text: '❌ This command is only available for the owner!',
                ...channelInfo
            });
            return;
        }

        if (!botData.autoReadSettings) botData.autoReadSettings = {};

        let enabled = !!botData.autoReadSettings[userId];

        if (args.length > 0) {
            const action = args[0].toLowerCase();
            if (action === 'on' || action === 'enable') {
                enabled = true;
            } else if (action === 'off' || action === 'disable') {
                enabled = false;
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Invalid option! Use: .autoread on/off',
                    ...channelInfo
                });
                return;
            }
        } else {
            enabled = !enabled;
        }

        botData.autoReadSettings[userId] = enabled;
        saveBotData();

        await sock.sendMessage(chatId, {
            text: `✅ Auto-read has been ${enabled ? 'enabled' : 'disabled'}!`,
            ...channelInfo
        });

    } catch (error) {
        console.error('Error in autoread command:', error);
        try {
            const channelInfo = await getChannelInfo(sock);
            await sock.sendMessage(chatId, {
                text: '❌ Error processing command!',
                ...channelInfo
            });
        } catch (e) {
            await sock.sendMessage(chatId, { text: '❌ Error processing command!' });
        }
    }
}

// Function to check if bot is mentioned in a message
function isBotMentionedInMessage(message, botNumber) {
    if (!message.message) return false;

    const messageTypes = [
        'extendedTextMessage', 'imageMessage', 'videoMessage', 'stickerMessage',
        'documentMessage', 'audioMessage', 'contactMessage', 'locationMessage'
    ];

    for (const type of messageTypes) {
        if (message.message[type]?.contextInfo?.mentionedJid) {
            const mentionedJid = message.message[type].contextInfo.mentionedJid;
            if (mentionedJid.some(jid => jid === botNumber)) {
                return true;
            }
        }
    }

    const textContent =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        message.message.imageMessage?.caption ||
        message.message.videoMessage?.caption || '';

    if (textContent) {
        const botUsername = botNumber.split('@')[0];
        if (textContent.includes(`@${botUsername}`)) {
            return true;
        }

        const botNames = [global.botname?.toLowerCase(), 'bot'];
        const words = textContent.toLowerCase().split(/\s+/);
        if (botNames.some(name => name && words.includes(name))) {
            return true;
        }
    }

    return false;
}

// Function to handle autoread functionality for this session
async function handleAutoread(sock, message, botData, userId) {
    if (isAutoreadEnabledFor(botData, userId)) {
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotMentioned = isBotMentionedInMessage(message, botNumber);

        if (isBotMentioned) {
            return false;
        } else {
            try {
                const key = { remoteJid: message.key.remoteJid, id: message.key.id, participant: message.key.participant };
                await sock.readMessages([key]);
                return true;
            } catch (e) {
                return false;
            }
        }
    }
    return false;
}

module.exports = {
    autoreadCommand,
    isAutoreadEnabledFor,
    isBotMentionedInMessage,
    handleAutoread
};
