// commands/islamic.js
// Complete Islamic auto-posting command system.
// Per-session isolation, owner-only config, reliable APIs, duplicate prevention.

const { IslamicScheduler } = require('../lib/islamicScheduler');
const { fetchRandomQayah, fetchPrayerTimes, searchIslamicVideo } = require('../lib/islamicApis');
const { hadithCollection, duaCollection, reminderCollection, getRandomItem } = require('../lib/islamicData');

function getSettings(botData, userId) {
  if (!botData.islamicSettings) botData.islamicSettings = {};
  if (!botData.islamicSettings[userId]) {
    botData.islamicSettings[userId] = {
      enabled: false,
      groups: [],
      features: { hadith: true, quran: true, dua: true, reminder: true, video: true, prayer: false },
      schedule: { hadith: '07:00', quran: '09:00', dua: '14:00', video: '19:00', reminder: '21:00' },
      timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Karachi',
      location: { city: process.env.DEFAULT_CITY || 'Lahore', country: process.env.DEFAULT_COUNTRY || 'Pakistan' },
      videoQueries: ['islamic reminder', 'quran recitation', 'short islamic lecture'],
      history: { hadith: [], quran: [], dua: [], video: [], reminder: [] }
    };
  }
  return botData.islamicSettings[userId];
}

function saveSettings(botData, saveBotData, userId, settings) {
  botData.islamicSettings[userId] = settings;
  saveBotData();
}

async function islamicCommand(sock, from, msg, isAdmin, isOwner, botData, saveBotData, userId, args, q, session) {
  session.botData = botData;

  const settings = getSettings(botData, userId);
  const sub = args[0]?.toLowerCase();
  const sub2 = args[1]?.toLowerCase();
  const sub3 = args[2]?.toLowerCase();

  const configCommands = ['setup', 'addgroup', 'removegroup', 'settime', 'timezone', 'location', 'video', 'source', 'reset'];
  if (configCommands.includes(sub) && !isOwner) {
    return await sock.sendMessage(from, { text: '❌ Only the bot owner can configure Islamic automation.' }, { quoted: msg });
  }

  switch (sub) {
    case 'on': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      settings.enabled = true;
      saveSettings(botData, saveBotData, userId, settings);
      if (session.islamicScheduler) session.islamicScheduler.stop();
      session.islamicScheduler = new IslamicScheduler(userId, sock, () => getSettings(botData, userId));
      session.islamicScheduler.start();
      return await sock.sendMessage(from, { text: '✅ Islamic auto-posting is now *ON*.' }, { quoted: msg });
    }
    case 'off': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      settings.enabled = false;
      saveSettings(botData, saveBotData, userId, settings);
      if (session.islamicScheduler) session.islamicScheduler.stop();
      return await sock.sendMessage(from, { text: '⏹️ Islamic auto-posting is now *OFF*.' }, { quoted: msg });
    }
    case 'status': {
      const isRegistered = settings.groups.includes(from);
      let text = `🕌 *Islamic Auto-Post Status*\n\n` +
                 `*Status:* ${settings.enabled ? '✅ ON' : '❌ OFF'}\n` +
                 `*Device:* ${userId}\n` +
                 `*Current Group:* ${isRegistered ? '✅ Registered' : '❌ Not Registered'}\n\n` +
                 `*Features:*\n` +
                 `• Hadith: ${settings.features.hadith ? '✅' : '❌'}\n` +
                 `• Quran: ${settings.features.quran ? '✅' : '❌'}\n` +
                 `• Dua: ${settings.features.dua ? '✅' : '❌'}\n` +
                 `• Reminder: ${settings.features.reminder ? '✅' : '❌'}\n` +
                 `• Video: ${settings.features.video ? '✅' : '❌'}\n` +
                 `• Prayer: ${settings.features.prayer ? '✅' : '❌'}\n\n` +
                 `*Schedule (Timezone: ${settings.timezone}):*\n`;
      for (const [k, v] of Object.entries(settings.schedule)) {
        if (v) text += `• ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}\n`;
      }
      text += `\n*Location:* ${settings.location.city}, ${settings.location.country}\n` +
              `*Registered Groups:* ${settings.groups.length}`;
      return await sock.sendMessage(from, { text }, { quoted: msg });
    }
    case 'setup': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      settings.enabled = true;
      if (from.endsWith('@g.us') && !settings.groups.includes(from)) settings.groups.push(from);
      saveSettings(botData, saveBotData, userId, settings);
      if (session.islamicScheduler) session.islamicScheduler.stop();
      session.islamicScheduler = new IslamicScheduler(userId, sock, () => getSettings(botData, userId));
      session.islamicScheduler.start();
      return await sock.sendMessage(from, { text: '✅ Islamic automation setup complete for this group.\n\nUse `.islamic status` to view configuration.' }, { quoted: msg });
    }
    case 'addgroup': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      if (!from.endsWith('@g.us')) return await sock.sendMessage(from, { text: '❌ Use this command inside a group.' }, { quoted: msg });
      if (!settings.groups.includes(from)) settings.groups.push(from);
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: '✅ This group has been added to Islamic auto-posting.' }, { quoted: msg });
    }
    case 'removegroup': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      settings.groups = settings.groups.filter(g => g !== from);
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: '✅ This group has been removed from Islamic auto-posting.' }, { quoted: msg });
    }
    case 'groups': {
      if (settings.groups.length === 0) return await sock.sendMessage(from, { text: '🕌 No groups are registered for Islamic auto-posting.' }, { quoted: msg });
      const metaPromises = settings.groups.map(async g => {
        try {
          const m = await sock.groupMetadata(g);
          return `• ${m.subject} (${g})`;
        } catch (e) { return `• ${g}`; }
      });
      const names = await Promise.all(metaPromises);
      return await sock.sendMessage(from, { text: `🕌 *Registered Islamic Groups:*\n\n${names.join('\n')}` }, { quoted: msg });
    }
    case 'hadith': {
      if (!sub2) return await sock.sendMessage(from, { text: `Hadith is currently ${settings.features.hadith ? 'ON' : 'OFF'}.\nUse .islamic hadith on/off` }, { quoted: msg });
      settings.features.hadith = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Hadith auto-post ${settings.features.hadith ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    case 'quran': {
      if (!sub2) return await sock.sendMessage(from, { text: `Quran is currently ${settings.features.quran ? 'ON' : 'OFF'}.\nUse .islamic quran on/off` }, { quoted: msg });
      settings.features.quran = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Quran auto-post ${settings.features.quran ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    case 'dua': {
      if (!sub2) return await sock.sendMessage(from, { text: `Dua is currently ${settings.features.dua ? 'ON' : 'OFF'}.\nUse .islamic dua on/off` }, { quoted: msg });
      settings.features.dua = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Dua auto-post ${settings.features.dua ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    case 'reminder': {
      if (!sub2) return await sock.sendMessage(from, { text: `Reminder is currently ${settings.features.reminder ? 'ON' : 'OFF'}.\nUse .islamic reminder on/off` }, { quoted: msg });
      settings.features.reminder = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Reminder auto-post ${settings.features.reminder ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    case 'video': {
      if (!sub2) return await sock.sendMessage(from, { text: `Video is currently ${settings.features.video ? 'ON' : 'OFF'}.\nUse .islamic video on/off` }, { quoted: msg });
      settings.features.video = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Video auto-post ${settings.features.video ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    case 'schedule':
    case 'times': {
      let text = `🕌 *Islamic Schedule*\n\n`;
      for (const [k, v] of Object.entries(settings.schedule)) {
        text += `• ${k.charAt(0).toUpperCase() + k.slice(1)}: ${v || 'Not set'}\n`;
      }
      text += `\nTimezone: ${settings.timezone}`;
      return await sock.sendMessage(from, { text }, { quoted: msg });
    }
    case 'settime': {
      if (!sub2 || !sub3) return await sock.sendMessage(from, { text: '❌ Usage: .islamic settime hadith 07:00' }, { quoted: msg });
      if (!/^\d{2}:\d{2}$/.test(sub3)) return await sock.sendMessage(from, { text: '❌ Time must be in HH:MM format (24h).' }, { quoted: msg });
      if (!settings.schedule.hasOwnProperty(sub2)) return await sock.sendMessage(from, { text: `❌ Unknown feature: ${sub2}. Valid: hadith, quran, dua, video, reminder` }, { quoted: msg });
      settings.schedule[sub2] = sub3;
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ ${sub2} schedule set to ${sub3}.` }, { quoted: msg });
    }
    case 'test': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      const testType = sub2 || 'hadith';
      const scheduler = new IslamicScheduler(userId, sock, () => settings);
      let content = await scheduler.generateContent(testType, settings, settings.history || {});
      if (!content) content = '❌ Could not generate test content (API may be unavailable). Try a different feature or check your connection.';
      return await sock.sendMessage(from, { text: `🧪 *Test Post (${testType})*\n\n${content}` }, { quoted: msg });
    }
    case 'sources': {
      return await sock.sendMessage(from, { text: `📚 *Islamic Content Sources*\n\n` +
        `*Hadith:* Curated authentic collection from Sahih Bukhari, Sahih Muslim, and Sunan al-Tirmidhi.\n` +
        `*Quran:* AlQuran Cloud API (public REST API, no key required).\n` +
        `*Dua:* Hisnul Muslim (Fortress of the Muslim) verified supplications.\n` +
        `*Reminders:* General Islamic reminders (not direct Quran/Hadith quotes unless attributed).\n` +
        `*Videos:* YouTube Data API (requires YOUTUBE_API_KEY in .env) — disabled if unavailable.\n` +
        `*Prayer Times:* AlAdhan API (public, no key required).`
      }, { quoted: msg });
    }
    case 'reset': {
      if (!isOwner) return await sock.sendMessage(from, { text: '❌ Owner only.' }, { quoted: msg });
      botData.islamicSettings[userId] = {
        enabled: false,
        groups: [],
        features: { hadith: true, quran: true, dua: true, reminder: true, video: true, prayer: false },
        schedule: { hadith: '07:00', quran: '09:00', dua: '14:00', video: '19:00', reminder: '21:00' },
        timezone: process.env.DEFAULT_TIMEZONE || 'Asia/Karachi',
        location: { city: process.env.DEFAULT_CITY || 'Lahore', country: process.env.DEFAULT_COUNTRY || 'Pakistan' },
        videoQueries: ['islamic reminder', 'quran recitation', 'short islamic lecture'],
        history: { hadith: [], quran: [], dua: [], video: [], reminder: [] }
      };
      saveBotData();
      if (session.islamicScheduler) session.islamicScheduler.stop();
      return await sock.sendMessage(from, { text: '✅ Islamic settings have been reset to defaults.' }, { quoted: msg });
    }
    case 'timezone': {
      if (!sub2) return await sock.sendMessage(from, { text: `Current timezone: ${settings.timezone}\nUsage: .islamic timezone Asia/Karachi` }, { quoted: msg });
      settings.timezone = sub2;
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Timezone set to ${sub2}.` }, { quoted: msg });
    }
    case 'location': {
      if (!sub2 || !sub3) return await sock.sendMessage(from, { text: 'Usage: .islamic location Lahore Pakistan' }, { quoted: msg });
      settings.location = { city: sub2, country: sub3 };
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Location set to ${sub2}, ${sub3}.` }, { quoted: msg });
    }
    case 'prayer': {
      if (!sub2) return await sock.sendMessage(from, { text: `Prayer reminders: ${settings.features.prayer ? 'ON' : 'OFF'}` }, { quoted: msg });
      settings.features.prayer = sub2 === 'on';
      saveSettings(botData, saveBotData, userId, settings);
      return await sock.sendMessage(from, { text: `✅ Prayer reminders ${settings.features.prayer ? 'enabled' : 'disabled'}.` }, { quoted: msg });
    }
    default: {
      return await sock.sendMessage(from, { text: `🕌 *Islamic Auto-Posting Commands*\n\n` +
        `.islamic on/off\n` +
        `.islamic status\n` +
        `.islamic setup\n` +
        `.islamic addgroup / removegroup\n` +
        `.islamic groups\n` +
        `.islamic hadith/quran/dua/reminder/video/prayer on/off\n` +
        `.islamic schedule / times\n` +
        `.islamic settime <feature> HH:MM\n` +
        `.islamic timezone <tz>\n` +
        `.islamic location <city> <country>\n` +
        `.islamic test [hadith/quran/dua/reminder/video]\n` +
        `.islamic sources\n` +
        `.islamic reset`
      }, { quoted: msg });
    }
  }
}

module.exports = { islamicCommand, getSettings };
