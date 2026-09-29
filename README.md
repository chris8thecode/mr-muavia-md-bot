# MR Muavia MD BOT

A multi-session WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys), with a
small local web dashboard for pairing, optional Telegram-based pairing-code delivery, and a set of
`.`-prefixed chat commands. Built to run primarily on **Termux (Android)**, though it also runs on
any machine with Node.js.

- **Owner:** MR MUAVIA
- **WhatsApp Channel:** https://whatsapp.com/channel/0029VbAYFuA7z4kXHVNHfM1Y

## Requirements

- **Node.js 20 or newer** (required by the current Baileys version this project uses)
- npm (this project uses `package-lock.json` as the source of truth - don't mix in pnpm/yarn)

## Deploying to Heroku

This project is Heroku-ready:

1. Create the app and push this code (Heroku detects Node via `package.json`'s `engines` field
   and uses the `Procfile`'s `web: node index.js`).
2. Set the required config var: `OWNER_NUMBER` (your WhatsApp number, international format, no
   `+`). Everything else in `.env.example` / `app.json` is optional and has a sensible default.
3. **Important - Heroku's filesystem is ephemeral.** Anything written to disk (session files
   under `auth_info/`, `data/bot_data.json`, temp media in `tmp/`) is wiped on every dyno
   restart/redeploy. For a production deployment you should point the auth/session storage and
   `data/bot_data.json` persistence at an external store (MongoDB, Supabase, or PostgreSQL) -
   this project does not currently include that adapter, so on Heroku you should expect to
   re-pair your WhatsApp number after each dyno cycle unless you add persistent storage yourself.
   Running on a host with a persistent disk (a VPS, or Termux as described below) avoids this
   entirely.
4. After the first deploy, set `APP_URL` to your Heroku app's URL so the built-in anti-sleep
   ping pings the right address.

Routes exposed by the web dashboard: `/` and `/connect` (pairing UI), `/dashboard` (same UI),
`/api/health` (liveness check), `/api/status` (aggregate, non-sensitive bot status - no keys,
numbers, or session data are ever returned by these endpoints), `/api/config` (public branding:
bot name, owner display number, channel URL, logo path - also never carries secrets).

## Setup (Termux)

```bash
pkg update && pkg upgrade
pkg install nodejs-lts git

git clone <this-repo-url>
cd <project-folder>

npm install
cp .env.example .env
# edit .env with a text editor (e.g. `nano .env`) if you want to change branding,
# add a Telegram token, or add API keys for optional features

npm start
```

Then open `http://localhost:3000` in a browser on the same device (or `http://<phone-ip>:3000` from
another device on the same network) to pair a WhatsApp number:

1. Enter the WhatsApp number to link (e.g. `923000000000`).
2. Click to request a pairing code.
3. On the phone that owns that number: **WhatsApp → Settings → Linked Devices → Link with phone
   number** and enter the code shown.
4. Once linked, the session is saved under `auth_info/<number>/` and will auto-reconnect on future
   restarts - no need to re-pair every time.

### Optional: pairing codes via Telegram

If you'd rather receive the pairing code through a Telegram bot instead of the web dashboard, set
`TELEGRAM_BOT_TOKEN` in `.env` (get a token from [@BotFather](https://t.me/BotFather)). Message your
bot `/start`, then send the WhatsApp number you want to pair. If `TELEGRAM_BOT_TOKEN` is left blank,
this feature is simply disabled and everything else still works normally.

## Configuration (`.env`)

See `.env.example` for the full list. Only `TENOR_API_KEY` is required for a specific feature
(`.emojimix`) - everything else has a sensible default or is optional.

| Variable | Purpose |
|---|---|
| `BOT_NAME`, `OWNER_NAME`, `OWNER_NUMBER`, `OWNER_DISPLAY_NUMBER`, `WELCOME_MESSAGE` | Branding shown in `.menu` / `.owner` |
| `LOGO_URL` | Image shown at the top of `.menu` |
| `CHANNEL_URL` | The bot's WhatsApp Channel invite link. The channel's internal ID is **resolved automatically at runtime** from this link (via Baileys) - it is never hardcoded, so changing this is all that's needed to point `.menu`'s "View channel" badge at a different channel |
| `TELEGRAM_BOT_TOKEN` | Optional - enables pairing-code delivery via Telegram |
| `OPENAI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Optional - powers the `.ai` auto-reply command |
| `GIPHY_API_KEY` | Optional - has a working public fallback key already |
| `TENOR_API_KEY` | Required for `.emojimix` |
| `PORT`, `APP_URL` | Local server port and the URL used by the built-in anti-sleep self-ping |

## Commands

`.menu` now groups everything into sections (OWNER, GROUP MANAGEMENT, PROTECTION, DOWNLOADER,
AI & TOOLS, ISLAMIC, AUTO REPLIES, SETTINGS) and hides owner/admin-only lines from users who
don't have permission to run them. No existing command was renamed or removed.

**User**
`.autoreacts [on/off]` · `.antilink [on/off/kick]` · `.antidelete [on/off]` · `.ai [on/off]` ·
`.autoreply [on/off]` (new - see below) ·
`.vv` · `.owner` · `.dp` · `.ping` · `.translate <text> <lang>` / `.trt <text> <lang>`

**Tools**
`.apk <name>` · `.facebook <url>` / `.fb <url>` · `.tiktok <url>` · `.insta <url>` / `.ig <url>` ·
`.song <name>` · `.video <name>` · `.joke` · `.meme` · `.emojimix <e1>+<e2>` ·
`.character (mention/reply)` · `.gdrive <url>` · `.mf <url>`

**Admin (group)**
`.private` · `.public` · `.autoread [on/off]` · `.status [on/off/seen/like/download/system]` ·
`.hack` · `.hidetag <text>` · `.tagall` · `.setname <name>` · `.anticall [on/off]` ·
`.kickoffline [on/off]` · `.antistatus [on/off]` · `.groupinfo` · `.accept`

Replying to a message and typing `.translate <lang>` (or `.trt <lang>`) translates the quoted
message; typing `.translate <text> <lang>` translates arbitrary text directly.

### New: `.autoreply` (lightweight greetings)

`.autoreply on` / `.autoreply off` (owner-only, off by default so existing behavior is
unchanged until you opt in). When on, the bot replies to ~20 common greetings sent as a
*complete* message (not a substring of a longer sentence) - Salam, Assalamualaikum, Hi, Hello,
Hey, Good Morning/Night/Afternoon/Evening, Kya haal hai / Kese ho, Thanks/Thank you/Shukriya,
Love, Shared, MashaAllah, SubhanAllah, Alhamdulillah, InshaAllah, Bhai, Help - matching is
case-insensitive and setting is isolated per WhatsApp session, same as every other toggle.

### Note on Status features (`.status download`)

`.status download on` forwards status updates from your contacts to your own WhatsApp DM. This
only processes status updates your own WhatsApp account is already permitted to see under
WhatsApp's normal status-privacy rules (i.e. contacts who have you in their status audience) -
it does not bypass view-once protection, does not scrape private/hidden statuses, and cannot see
anything your account couldn't already see in the WhatsApp app. You are responsible for
complying with WhatsApp's Terms of Service and any applicable law regarding saving or
redistributing other people's content.

## Notes on WhatsApp Channel integration

`.menu` attaches a "View channel" context to the message when possible. This uses Baileys'
`newsletterMetadata('invite', code)` to resolve the real channel JID from the `CHANNEL_URL` invite
link at runtime - the JID is never guessed or hardcoded. If the installed Baileys version doesn't
support this, or the lookup fails (network issue, invalid link, etc.), the menu is still sent
normally without the channel badge - it will never crash the bot.

Note: this only attaches the "forwarded from channel" visual context to messages. It is **not** the
same as automatically making a user follow the channel - WhatsApp doesn't support forcing a user to
follow a channel, and this project doesn't claim to.

## Running with PM2 (optional)

PM2 is optional - Termux/`npm start` is the primary way to run this bot. If you do want PM2:

```bash
pm2 start ecosystem.config.js
```

## Session isolation

Every per-user setting (prefix, AI on/off, auto-react, auto-read, Anti-Delete, Anti-Link,
Anti-Call, Anti-Status, status auto-download, Islamic scheduler, and the new Auto-Reply) is keyed
by `userId` in `data/bot_data.json` or an in-memory store keyed by `userId`. One WhatsApp session
on this bot cannot see or change another session's settings, message logs, or Anti-Delete
recoveries.

## Known limitations

- `data/bot_data.json`, `auth_info/`, and `tmp/` are plain local files - fine for Termux/VPS use,
  but wiped on every Heroku dyno restart (see the Heroku section above). Add a MongoDB/Supabase/
  Postgres adapter if you need settings and sessions to survive Heroku dyno cycles.
- Anti-Delete's message buffer is in-memory per session (not written to disk), so a server
  restart clears any not-yet-deleted messages it was holding. This is intentional - it avoids
  persisting other people's raw message content to disk.
- `multer`, `node-webpmux`, `qrcode-terminal`, and `sharp` are listed in `package.json` but are not
  currently used anywhere in the code. They're harmless to keep, but can be removed to shrink the
  install size if you don't plan to use them.

## Troubleshooting

- **Bot won't start / "Cannot find module"** → run `npm install` again; make sure you're on Node 20+.
- **Pairing code doesn't work** → codes expire quickly; request a new one and enter it promptly.
- **Session keeps logging out** → this usually means WhatsApp force-logged the linked device (e.g.
  from the phone app); just re-pair.
- **A downloader command (`.tiktok`, `.facebook`, `.song`, etc.) fails** → the underlying third-party
  API may be temporarily down; the bot will reply with an error instead of crashing. Try again later.
