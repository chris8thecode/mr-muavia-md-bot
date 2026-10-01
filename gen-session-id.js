// Generate a SESSION_ID string from an already-paired WhatsApp session.
//
// Usage (on the machine/phone where the bot is paired, e.g. Termux):
//     node gen-session-id.js <userId>
// Example:
//     node gen-session-id.js 923200799496
//
// The printed string goes into the SESSION_ID environment variable on your
// host (e.g. Render Dashboard -> Environment). The bot restores the session
// from it on every startup, so Render's wiped filesystem doesn't log you out.
//
// ⚠️  SECURITY WARNING: this string grants FULL access to that WhatsApp
// account (read/send messages as you). NEVER commit it to git, NEVER paste
// it in chat, email or screenshots. Paste it ONLY into your host's env-var
// dashboard. If it ever leaks, open WhatsApp -> Linked Devices and remove
// the session, then generate a fresh one.

const fs = require('fs-extra');
const path = require('path');

const userId = process.argv[2];
if (!userId) {
    console.error('Usage: node gen-session-id.js <userId>');
    console.error('Example: node gen-session-id.js 923200799496');
    process.exit(1);
}

const dir = path.join(__dirname, 'auth_info', String(userId));
if (!fs.existsSync(path.join(dir, 'creds.json'))) {
    console.error(`No paired session found at auth_info/${userId}/`);
    console.error('Pair this number first (QR or pairing code), then re-run this script.');
    process.exit(1);
}

const files = {};
for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isFile()) {
        files[name] = fs.readFileSync(p).toString('base64');
    }
}

const sid = Buffer.from(JSON.stringify({ userId: String(userId), files })).toString('base64');

console.log('');
console.log('=========== SESSION_ID  (KEEP SECRET!) ===========');
console.log(sid);
console.log('====================================================');
console.log('');
console.log('Copy the ENTIRE string above into the SESSION_ID environment');
console.log('variable in your Render dashboard (Environment tab).');
console.log('Do NOT put it in GitHub, chat, or screenshots.');
