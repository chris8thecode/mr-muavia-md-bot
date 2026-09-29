// lib/islamicScheduler.js
// Session-isolated daily scheduler using node-cron.
// Persistent state, duplicate prevention, timezone support, graceful recovery.

const cron = require('node-cron');
const path = require('path');
const fs = require('fs-extra');
const { fetchRandomQayah, fetchPrayerTimes, searchIslamicVideo } = require('./islamicApis');
const { hadithCollection, duaCollection, reminderCollection, getRandomItem } = require('./islamicData');

const SCHEDULER_STATE_FILE = path.join(__dirname, '../data/islamic_scheduler_state.json');

function loadState() {
  if (fs.existsSync(SCHEDULER_STATE_FILE)) {
    try { return fs.readJsonSync(SCHEDULER_STATE_FILE); } catch (e) { return {}; }
  }
  return {};
}

function saveState(state) {
  fs.ensureDirSync(path.dirname(SCHEDULER_STATE_FILE));
  fs.writeJsonSync(SCHEDULER_STATE_FILE, state);
}

function getSessionState(userId) {
  const all = loadState();
  if (!all[userId]) all[userId] = {};
  return all[userId];
}

function setSessionState(userId, data) {
  const all = loadState();
  all[userId] = data;
  saveState(all);
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getLocalTime(timezone) {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);
    const h = parseInt(parts.find(p => p.type === 'hour').value, 10);
    const m = parseInt(parts.find(p => p.type === 'minute').value, 10);
    return { hours: h, minutes: m, totalMinutes: h * 60 + m };
  } catch (e) {
    return { hours: now.getHours(), minutes: now.getMinutes(), totalMinutes: now.getHours() * 60 + now.getMinutes() };
  }
}

function formatIslamicPost(type, data) {
  switch (type) {
    case 'hadith':
      return `🕌 *Daily Hadith*\n\n${data.arabic ? `*Arabic:*\n${data.arabic}\n\n` : ''}*Translation:*\n${data.text}\n\n📚 *Source:* ${data.source}\n#️⃣ *Reference:* ${data.reference}\n✅ *Grade:* ${data.grade}`;
    case 'quran':
      return `📖 *Quranic Verse*\n\n*Arabic:*\n${data.arabic}\n\n*Translation:*\n${data.translation}\n\n📍 *Surah ${data.surah} (${data.surahNumber}):${data.ayahNumber}*`;
    case 'dua':
      return `🤲 *Daily Dua*\n\n*Arabic:*\n${data.arabic}\n\n*Translation:*\n${data.translation}\n\n📖 *Source:* ${data.source}\n🕐 *Occasion:* ${data.occasion}`;
    case 'reminder':
      return data.text;
    case 'video':
      return `🎥 *Islamic Video*\n\n*Title:* ${data.title}\n*Channel:* ${data.channel}\n\n🔗 ${data.url}`;
    case 'prayer':
      return `🕌 *Prayer Times Reminder*\n\nCity: ${data.city}, ${data.country}\n\n*Fajr:* ${data.times.fajr}\n*Dhuhr:* ${data.times.dhuhr}\n*Asr:* ${data.times.asr}\n*Maghrib:* ${data.times.maghrib}\n*Isha:* ${data.times.isha}\n\nMay Allah accept your prayers.`;
    default:
      return '';
  }
}

class IslamicScheduler {
  constructor(userId, sock, getSettingsFunc) {
    this.userId = userId;
    this.sock = sock;
    this.getSettings = getSettingsFunc;
    this.task = null;
    this.lastCheckDate = null;
  }

  start() {
    this.stop();
    this.task = cron.schedule('* * * * *', () => this.tick(), { scheduled: true });
    console.log(`[IslamicScheduler] Started for ${this.userId}`);
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log(`[IslamicScheduler] Stopped for ${this.userId}`);
    }
  }

  async tick() {
    const settings = this.getSettings();
    if (!settings || !settings.enabled) return;

    const groups = settings.groups || [];
    if (groups.length === 0) return;

    const tz = settings.timezone || 'Asia/Karachi';
    const now = getLocalTime(tz);
    const state = getSessionState(this.userId);
    if (!state.lastSent) state.lastSent = {};

    const todayKey = new Date().toISOString().slice(0, 10);

    for (const [feature, timeStr] of Object.entries(settings.schedule || {})) {
      if (!timeStr) continue;
      if (!settings.features[feature]) continue;

      const featureMinutes = timeToMinutes(timeStr);
      // 1-minute window to account for cron drift
      if (now.totalMinutes === featureMinutes || now.totalMinutes === featureMinutes + 1) {
        const sentKey = `${todayKey}_${feature}`;
        if (state.lastSent[sentKey]) continue;

        const content = await this.generateContent(feature, settings, state);
        if (!content) continue;

        for (const groupId of groups) {
          try {
            await this.sock.sendMessage(groupId, { text: content });
          } catch (e) {
            console.error(`[IslamicScheduler] Failed to send to ${groupId}:`, e.message);
          }
        }

        state.lastSent[sentKey] = true;
        setSessionState(this.userId, state);
      }
    }

    if (settings.features.prayer) {
      await this.handlePrayerReminders(settings, state, groups, tz);
    }
  }

  async generateContent(feature, settings, state) {
    const hist = settings.history || {};
    switch (feature) {
      case 'hadith': {
        const item = getRandomItem(hadithCollection, hist.hadith || [], 10);
        if (item) {
          if (!hist.hadith) hist.hadith = [];
          return formatIslamicPost('hadith', item);
        }
        return null;
      }
      case 'quran': {
        const item = await fetchRandomQayah(hist.quran || []);
        if (item) {
          if (!hist.quran) hist.quran = [];
          hist.quran.push(item.ayahNumber);
          return formatIslamicPost('quran', item);
        }
        return null;
      }
      case 'dua': {
        const item = getRandomItem(duaCollection, hist.dua || [], 8);
        if (item) {
          if (!hist.dua) hist.dua = [];
          return formatIslamicPost('dua', item);
        }
        return null;
      }
      case 'reminder': {
        const item = getRandomItem(reminderCollection, hist.reminder || [], 8);
        if (item) {
          if (!hist.reminder) hist.reminder = [];
          return formatIslamicPost('reminder', item);
        }
        return null;
      }
      case 'video': {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const queries = settings.videoQueries || ['islamic reminder', 'quran recitation', 'short islamic lecture'];
        const query = queries[Math.floor(Math.random() * queries.length)];
        const item = await searchIslamicVideo(query, apiKey, hist.video || []);
        if (item) {
          if (!hist.video) hist.video = [];
          hist.video.push(item.videoId);
          return formatIslamicPost('video', item);
        }
        return null;
      }
      default:
        return null;
    }
  }

  async handlePrayerReminders(settings, state, groups, tz) {
    const loc = settings.location || { city: process.env.DEFAULT_CITY || 'Lahore', country: process.env.DEFAULT_COUNTRY || 'Pakistan' };
    const times = await fetchPrayerTimes(loc.city, loc.country);
    if (!times) return;

    const now = getLocalTime(tz);
    const prayers = [
      { name: 'Fajr', time: times.fajr },
      { name: 'Dhuhr', time: times.dhuhr },
      { name: 'Asr', time: times.asr },
      { name: 'Maghrib', time: times.maghrib },
      { name: 'Isha', time: times.isha }
    ];

    const todayKey = new Date().toISOString().slice(0, 10);

    for (const p of prayers) {
      const pm = timeToMinutes(p.time);
      if (now.totalMinutes === pm || now.totalMinutes === pm + 1) {
        const sentKey = `${todayKey}_prayer_${p.name}`;
        if (state.lastSent[sentKey]) continue;
        const msg = formatIslamicPost('prayer', { city: loc.city, country: loc.country, times });
        for (const groupId of groups) {
          try { await this.sock.sendMessage(groupId, { text: msg }); } catch (e) {}
        }
        state.lastSent[sentKey] = true;
      }
    }
    setSessionState(this.userId, state);
  }
}

module.exports = { IslamicScheduler, getLocalTime, timeToMinutes };
