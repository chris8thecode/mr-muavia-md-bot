// lib/islamicApis.js
// External API wrappers with timeouts and graceful error handling.
// No API keys required except YOUTUBE_API_KEY (optional).

const axios = require('axios');

const QURAN_API_BASE = 'https://api.alquran.cloud/v1';
const PRAYER_API_BASE = 'https://api.aladhan.com/v1';

// Fetch a random ayah with Arabic (Uthmani) + English (Asad) translation
async function fetchRandomQayah(history = []) {
  try {
    let ayahNum;
    let attempts = 0;
    do {
      ayahNum = Math.floor(Math.random() * 6236) + 1;
      attempts++;
    } while (history.includes(ayahNum) && attempts < 20);

    const url = `${QURAN_API_BASE}/ayah/${ayahNum}/editions/quran-uthmani,en.asad`;
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data.data;

    const arabic = data.find(e => e.edition.identifier === 'quran-uthmani');
    const english = data.find(e => e.edition.identifier === 'en.asad');

    return {
      arabic: arabic?.text || '',
      translation: english?.text || '',
      surah: arabic?.surah?.englishName || english?.surah?.englishName || 'Unknown',
      surahNumber: arabic?.surah?.number || 0,
      ayahNumber: arabic?.numberInSurah || 0,
      reference: `${arabic?.surah?.englishName || ''} ${arabic?.numberInSurah || 0}`
    };
  } catch (e) {
    console.error('[Islamic API] Quran fetch failed:', e.message);
    return null;
  }
}

// Prayer times by city using AlAdhan API (no key required)
async function fetchPrayerTimes(city, country, method = 2) {
  try {
    const url = `${PRAYER_API_BASE}/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    const res = await axios.get(url, { timeout: 10000 });
    const timings = res.data?.data?.timings;
    if (!timings) return null;
    return {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha
    };
  } catch (e) {
    console.error('[Islamic API] Prayer times fetch failed:', e.message);
    return null;
  }
}

// YouTube search (requires YOUTUBE_API_KEY in .env)
async function searchIslamicVideo(query, apiKey, history = []) {
  if (!apiKey) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&videoDuration=short&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 10000 });
    const items = res.data?.items || [];
    if (items.length === 0) return null;

    let available = items.filter(i => !history.includes(i.id.videoId));
    if (available.length === 0) return null;

    const pick = available[Math.floor(Math.random() * available.length)];
    return {
      title: pick.snippet.title,
      url: `https://youtube.com/watch?v=${pick.id.videoId}`,
      channel: pick.snippet.channelTitle,
      videoId: pick.id.videoId
    };
  } catch (e) {
    console.error('[Islamic API] YouTube search failed:', e.message);
    return null;
  }
}

module.exports = {
  fetchRandomQayah,
  fetchPrayerTimes,
  searchIslamicVideo
};
