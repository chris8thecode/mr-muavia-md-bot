async function calcCommand(sock, from, msg, q) {
    const expr = (q || '').trim();
    if (!expr) {
        return await sock.sendMessage(from, { text: '❌ Usage: .calc <expression>\nExample: .calc 2 + 2 * 5' }, { quoted: msg });
    }
    if (!/^[0-9+\-*/().%^\s]+$/.test(expr)) {
        return await sock.sendMessage(from, { text: '❌ Only numbers and +  -  *  /  (  )  %  ^ allowed.' }, { quoted: msg });
    }
    try {
        const safe = expr.replace(/\^/g, '**');
        const result = Function('"use strict"; return (' + safe + ')')();
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('bad result');
        const pretty = Math.round(result * 1e10) / 1e10;
        await sock.sendMessage(from, { text: `🧮 *Calculator*\n\n📝 Expression: \`${expr}\`\n✅ Result: *${pretty}*` }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(from, { text: '❌ Invalid expression!' }, { quoted: msg });
    }
}
module.exports = calcCommand;
