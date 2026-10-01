async function rollCommand(sock, from, msg, q) {
    // Supports: .roll  |  .roll 20  |  .roll 2d6
    const input = (q || '').trim().toLowerCase();
    let count = 1, sides = 6;
    const dMatch = input.match(/^(\d{1,2})d(\d{1,4})$/);
    if (dMatch) {
        count = Math.min(parseInt(dMatch[1], 10), 10);
        sides = Math.min(parseInt(dMatch[2], 10), 1000);
    } else if (/^\d{1,4}$/.test(input)) {
        sides = Math.min(parseInt(input, 10), 1000);
    }
    if (sides < 2) sides = 6;
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(1 + Math.floor(Math.random() * sides));
    const total = rolls.reduce((a, b) => a + b, 0);
    const detail = count > 1 ? ` (${rolls.join(' + ')})` : '';
    await sock.sendMessage(from, { text: `🎲 *Dice Roll* — d${sides}\n\nResult: *${total}*${detail}` }, { quoted: msg });
}
module.exports = rollCommand;
