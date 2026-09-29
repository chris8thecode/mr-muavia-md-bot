

const axios = require('axios');
const settings = require('../settings');

const REQUEST_TIMEOUT = 20000;
const DOWNLOAD_TIMEOUT = 90000;
const MAX_APK_BYTES = 100 * 1024 * 1024; // 100MB safety cap

/**
 * APK Downloader Command
 * Fetches APK details & downloads the file using the NexOracle API.
 */
async function apkCommand(sock, chatId, message) {
  try {
    // Extract the user message
    const userMessage =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      '';
    const appName = userMessage.split(' ').slice(1).join(' ').trim();

    if (!appName) {
      await sock.sendMessage(
        chatId,
        { text: '⚠️ Please provide an app name. Example: `.apk whatsapp`' },
        { quoted: message }
      );
      return;
    }

    // React with hourglass while processing
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

    // API call to NexOracle
    const apiUrl = 'https://api.nexoracle.com/downloader/apk';
    const params = {
      apikey: 'free_key@maher_apis',
      q: appName,
    };

    let response;
    try {
      response = await axios.get(apiUrl, { params, timeout: REQUEST_TIMEOUT });
    } catch (apiErr) {
      console.error('NexOracle APK API request failed:', apiErr.message);
      await sock.sendMessage(
        chatId,
        { text: '❌ The APK lookup service is unreachable right now. Please try again later.' },
        { quoted: message }
      );
      return;
    }

    if (!response.data || response.data.status !== 200 || !response.data.result) {
      await sock.sendMessage(
        chatId,
        { text: '❌ Unable to find the APK. Please try again later.' },
        { quoted: message }
      );
      return;
    }

    const { name, lastup, package: pkgId, size, icon, dllink } = response.data.result;

    if (!dllink) {
      await sock.sendMessage(
        chatId,
        { text: '❌ No download link was returned for that app.' },
        { quoted: message }
      );
      return;
    }

    // Send thumbnail preview
    try {
      await sock.sendMessage(
        chatId,
        {
          image: { url: icon },
          caption: `📦 *Downloading ${name}... Please wait.*`,
        },
        { quoted: message }
      );
    } catch (previewErr) {
      // Missing/broken icon shouldn't block the actual download
      console.error('APK preview image failed:', previewErr.message);
    }

    // Check size before pulling the whole file into memory, when the API reports one
    const reportedSize = parseSizeToBytes(size);
    if (reportedSize && reportedSize > MAX_APK_BYTES) {
      await sock.sendMessage(
        chatId,
        { text: `❌ *${name}* is ${size}, which is over the ${Math.round(MAX_APK_BYTES / (1024 * 1024))}MB limit this bot can send. Try downloading it manually instead.` },
        { quoted: message }
      );
      return;
    }

    // Download APK file
    let apkResponse;
    try {
      apkResponse = await axios.get(dllink, {
        responseType: 'arraybuffer',
        timeout: DOWNLOAD_TIMEOUT,
        maxContentLength: MAX_APK_BYTES,
        maxBodyLength: MAX_APK_BYTES
      });
    } catch (downloadErr) {
      console.error('APK download failed:', downloadErr.message);
      const tooLarge = /maxContentLength|maxBodyLength/i.test(downloadErr.message || '');
      await sock.sendMessage(
        chatId,
        { text: tooLarge
            ? `❌ *${name}* is too large for this bot to send.`
            : '❌ Failed to download the APK. Please try again later.' },
        { quoted: message }
      );
      return;
    }

    if (!apkResponse.data) {
      await sock.sendMessage(
        chatId,
        { text: '❌ Failed to download the APK. Please try again later.' },
        { quoted: message }
      );
      return;
    }

    const apkBuffer = Buffer.from(apkResponse.data);

    // Format message with details
    const details = `📦 *APK Details* 📦\n\n` +
      `🔖 *Name*: ${name}\n` +
      `📅 *Last Update*: ${lastup}\n` +
      `📦 *Package*: ${pkgId}\n` +
      `📏 *Size*: ${size}\n\n` +
      `> © POWERED BY ${settings.ownerName.toUpperCase()}`;

    // Send APK as document
    await sock.sendMessage(
      chatId,
      {
        document: apkBuffer,
        mimetype: 'application/vnd.android.package-archive',
        fileName: `${name}.apk`,
        caption: details
      },
      { quoted: message }
    );

    // Success reaction
    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

  } catch (error) {
    console.error('Error in apkCommand:', error);

    await sock.sendMessage(
      chatId,
      { text: '❌ Unable to fetch APK details. Please try again later.' },
      { quoted: message }
    );

    // Failure reaction
    try {
      await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    } catch (e) {}
  }
}

function parseSizeToBytes(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return null;
  const match = sizeStr.trim().match(/^([\d.]+)\s*(KB|MB|GB)$/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multiplier = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : 1024;
  return value * multiplier;
}

module.exports = apkCommand;
