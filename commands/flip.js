async function flipCommand(sock, from, msg) {
    const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
    await sock.sendMessage(from, { text: `🪙 *Coin Flip*\n\nResult: *${result}*` }, { quoted: msg });
}
module.exports = flipCommand;
