const axios = require('axios');

async function githubCommand(sock, from, msg, q) {
    const username = (q || '').trim().split(/\s+/)[0].replace(/^@/, '');
    if (!username) {
        return await sock.sendMessage(from, { text: '❌ Usage: .github <username>\nExample: .github torvalds' }, { quoted: msg });
    }
    try {
        const res = await axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, {
            timeout: 15000,
            headers: { 'User-Agent': 'MR-MUAVIA-MD-BOT/1.0' }
        });
        const u = res.data;
        const text =
            `🐙 *GitHub Profile*\n\n` +
            `👤 *${u.name || u.login}* (@${u.login})\n` +
            (u.bio ? `📝 ${u.bio}\n` : '') +
            (u.location ? `📍 ${u.location}\n` : '') +
            (u.company ? `🏢 ${u.company}\n` : '') +
            `\n📦 Repos: *${u.public_repos}*   👥 Followers: *${u.followers}*   ➡️ Following: *${u.following}*\n` +
            `🔗 ${u.html_url}`;
        if (u.avatar_url) {
            await sock.sendMessage(from, { image: { url: u.avatar_url }, caption: text }, { quoted: msg });
        } else {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
    } catch (e) {
        await sock.sendMessage(from, { text: `❌ GitHub user "${username}" not found.` }, { quoted: msg });
    }
}
module.exports = githubCommand;
