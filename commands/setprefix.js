// commands/setprefix.js
// Per-session configurable command prefix.

async function setprefixCommand(sock, from, msg, isAdmin, botData, saveBotData, userId, args) {
  const sender = msg.key.participant || msg.key.remoteJid;
  const botNumber = require('@whiskeysockets/baileys').jidNormalizedUser(sock.user.id);
  const isOwner = sender.includes(botNumber.split('@')[0]);

  if (!isOwner) {
    return await sock.sendMessage(from, { text: '❌ Only the bot owner can change the prefix.' }, { quoted: msg });
  }

  const newPrefix = args[0];
  if (!newPrefix || newPrefix.length !== 1) {
    return await sock.sendMessage(from, { text: '❌ Provide a single character prefix.\nExample: .setprefix !' }, { quoted: msg });
  }

  if (!botData.prefixSettings) botData.prefixSettings = {};
  botData.prefixSettings[userId] = newPrefix;
  saveBotData();

  await sock.sendMessage(from, { text: `✅ Prefix changed to *${newPrefix}* for this device.\n\nExample: ${newPrefix}menu` }, { quoted: msg });
}

module.exports = setprefixCommand;
