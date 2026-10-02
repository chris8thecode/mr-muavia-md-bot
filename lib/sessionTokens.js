// Dashboard session-ownership tokens.
//
// SECURITY MODEL: the web dashboard is public (anyone can open the pairing
// page), but each WhatsApp session may only be viewed/managed by the browser
// that paired it. When a pairing is requested, the server issues a
// cryptographically random owner token for that userId. The browser stores it
// in localStorage and must present it on every subsequent socket.io action
// (set-user, pair-request on an existing session, logout). Without the token
// the server rejects the action — so one visitor can never see, query or
// disconnect another user's WhatsApp session.
//
// The token is bound at pairing time. Completing the pairing (entering the
// code inside the WhatsApp app) is the proof that the requester owns the
// number, so issuance is safe. Tokens live in Postgres (survive restarts on
// hosts with ephemeral filesystems) with an in-memory fallback.

const crypto = require('crypto');

let pool = null;
function getPool() {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    if (!pool) {
        const { Pool } = require('pg');
        pool = new Pool({
            connectionString: url,
            ssl: { rejectUnauthorized: false },
            max: 3,
        });
        pool.on('error', (err) => console.error('[Tokens] pool error:', err.message));
    }
    return pool;
}

async function ensureTokensTable() {
    const p = getPool();
    if (!p) return false;
    await p.query(`
        CREATE TABLE IF NOT EXISTS dashboard_tokens (
            user_id    TEXT PRIMARY KEY,
            token      TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    `);
    return true;
}

// In-memory fallback when DATABASE_URL is absent (Termux).
const memTokens = new Map();

async function getToken(userId) {
    try {
        const p = getPool();
        if (p) {
            await ensureTokensTable();
            const r = await p.query('SELECT token FROM dashboard_tokens WHERE user_id = $1', [userId]);
            return r.rows.length ? r.rows[0].token : null;
        }
    } catch (e) {
        console.error('[Tokens] get failed, using memory fallback:', e.message);
    }
    return memTokens.get(userId) || null;
}

async function setToken(userId, token) {
    try {
        const p = getPool();
        if (p) {
            await ensureTokensTable();
            await p.query(
                `INSERT INTO dashboard_tokens (user_id, token, created_at)
                 VALUES ($1, $2, now())
                 ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, created_at = now()`,
                [userId, token]
            );
            return;
        }
    } catch (e) {
        console.error('[Tokens] set failed, using memory fallback:', e.message);
    }
    memTokens.set(userId, token);
}

async function deleteToken(userId) {
    try {
        const p = getPool();
        if (p) {
            await ensureTokensTable();
            await p.query('DELETE FROM dashboard_tokens WHERE user_id = $1', [userId]);
            return;
        }
    } catch (e) {
        console.error('[Tokens] delete failed:', e.message);
    }
    memTokens.delete(userId);
}

// Constant-time comparison so tokens can't be guessed byte-by-byte.
async function verifyToken(userId, token) {
    if (!userId || !token) return false;
    const expected = await getToken(String(userId));
    if (!expected) return false;
    const a = Buffer.from(String(token));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function newToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = { getToken, setToken, deleteToken, verifyToken, newToken };
