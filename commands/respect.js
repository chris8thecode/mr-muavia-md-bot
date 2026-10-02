/**
 * Respect / appreciation commands (KHANTHEHACKER-style RESPECT section).
 * Each trigger sends a short warm respectful message. Usage: .respect, .salam, etc.
 * Anyone can use these; optional mention/reply target is greeted by name when given.
 */
const RESPONSES = {
    respect: "🙏 *Respect!* Izzat dena sab se bari khoobi hai. Aap ki qadr karta hun!",
    salute: "🫡 *Salute!* Aap ki himmat aur jazbe ko salaam!",
    salam: "🤲 *Assalam-o-Alaikum!* Allah aap par apni rehmat nazil farmaye. Ameen!",
    adab: "🙇 *Adab!* Tehzeeb aur ikhlaq hi insaan ki pehchan hai.",
    jazakallah: "🤲 *JazakAllah Khair!* Allah aap ko is ka behtareen ajar de. Ameen!",
    shukria: "💝 *Shukriya!* Aap ka ehsaan yaad rahega. Dil se shukar guzar hun!",
    thankyou: "🙏 *Thank you!* Your kindness means a lot. Truly appreciated!",
    sorry: "💛 *It's okay!* Ghalti insaan se hoti hai, maaf karna bari baat hai.",
    maafi: "🤲 *Maafi qabool!* Dil saaf, shikwa khatam. Aage barhte hain!",
    tazeem: "👑 *Tazeem!* Aap jaisay logon se hi mehfil roshan hoti hai.",
    izzat: "🌟 *Izzat!* Jo doosron ko izzat deta hai, wo khud izzat pata hai.",
    qadr: "💎 *Qadr!* Aap ki qeemat lafzon se bayaan nahi ho sakti.",
    ahsan: "✨ *Ahsan!* Aap ka ehsaan kabhi faramosh nahi hoga.",
    mehrbani: "🤗 *Mehrbani!* Aap ki nawazish ka dil se shukriya!",
    nawaz: "🎁 *Nawazish!* Aap ki ataon ka shukar guzar hun!",
    salaam: "🤲 *Salaam!* Khush raho, abaad raho. Duaon mein yaad rakhna!",
    tasleem: "🙇 *Tasleem!* Aap ki azmat ko dil se tasleem karta hun!",
    shandar: "🔥 *Shandar!* Kya baat hai, kamal kar diya aap ne!",
    zabardast: "💪 *Zabardast!* Aap ne to dil jeet liya!",
    kamaal: "⭐ *Kamaal!* Aap ki salahiyaton ka koi jawab nahi!",
    lajawab: "🏆 *Lajawab!* Aap be-misaal hain, waqai lajawab!",
    mashallah: "🧿 *MashaAllah!* Allah aap ko nazr-e-bad se mehfooz rakhe. Ameen!",
    subhanallah: "✨ *SubhanAllah!* Allah ki qudrat par qurban!",
    barkatein: "🤲 *Barkatein!* Allah aap ke rizq aur zindagi mein barkat de. Ameen!",
    duain: "🤲 *Duain!* Meri duain hamesha aap ke saath hain!",
    khidmat: "🙌 *Khidmat!* Khidmat-e-khalq sab se bara ibadat hai. Aap ko salaam!",
    ehtram: "🎖️ *Ehtram!* Aap ka ehtram mere dil mein hamesha rahega!",
    appreciation: "👏 *Appreciation!* Your efforts never go unnoticed. Well done!",
    proud: "🦁 *Proud!* Aap par fakhar hai, aise hi chamakte raho!",
    grateful: "💛 *Grateful!* Dil se shukar guzar hun aap ka!",
    karam: "🌧️ *Karam!* Allah ka karam aap par hamesha barsay. Ameen!",
    inayat: "🎁 *Inayat!* Aap ki inayat ka behad shukriya!",
    lutf: "😊 *Lutf!* Aap ki sohbat mein lutf aagaya!",
    mihr: "☀️ *Mihr!* Aap ki mohabbat roshni ki tarah hai!",
    shafqat: "🤗 *Shafqat!* Aap ki shafqat ka saya hamesha qaim rahe!",
    rahmat: "🌙 *Rahmat!* Allah ki rahmat aap par nazil ho. Ameen!",
    naimat: "🍯 *Naimat!* Aap jaisay log Allah ki naimat hain!",
    congratulations: "🎉 *Congratulations!* Bohat bohat mubarak ho! Aise hi kamyabiyan milti rahein!",
    mubarak: "🎊 *Mubarak ho!* Allah aap ko mazeed kamyabiyan ata farmaye. Ameen!",
    badhai: "🥳 *Badhai ho!* Khushiyan aap ka muqaddar hon!",
    tahseen: "👏 *Tahseen!* Aap ki tareef mein kya kahun, alfaaz kam par jayein!",
    afreen: "🌹 *Afreen!* Kya khoob, kya kehne! Bohat aala!",
    wah: "😍 *Wah!* Kya baat hai, dil khush kar diya!",
    khushi: "😄 *Khushi!* Aap ki khushi mein meri khushi hai!",
    dilse: "❤️ *Dil se!* Ye izzat dil ki gehraiyon se hai!",
    legend: "🐐 *Legend!* Aap to legend ho, is mein koi shak nahi!",
    hero: "🦸 *Hero!* Asli hero wo jo doosron ke kaam aaye — jaise aap!",
    superstar: "🌟 *Superstar!* Aap ki chamak sab se alag hai!",
    rockstar: "🎸 *Rockstar!* Full rockstar wali personality hai aap ki!",
    champion: "🏆 *Champion!* Jeet aap ka muqaddar hai, champion!",
    boss: "💼 *Boss!* Boss wali baat hai aap mein!",
    king: "👑 *King!* Rajaon wali shaan hai aap ki!",
    queen: "👸 *Queen!* Malikaon wali izzat hai aap ki!",
    gem: "💎 *Gem!* Aap heera hain, nayab aur qeemti!",
    diamond: "💠 *Diamond!* Kohinoor se kam nahi aap!",
    precious: "🔮 *Precious!* Aap bohat qeemti hain, sambhal kar rakhna chahiye!",
    valuable: "🏅 *Valuable!* Aap ki qadr har mehfil mein hai!",
    deserving: "🎯 *Deserving!* Aap har kamyabi ke mustahiq hain!",
    inspiration: "💡 *Inspiration!* Aap doosron ke liye misaal hain!",
    rolemodel: "🧭 *Role Model!* Aap jaisa banna har kisi ka khwab hai!",
    mentor: "📚 *Mentor!* Aap ki rehnumai mein hi kamyabi hai!",
    genius: "🧠 *Genius!* Aap ka dimagh to kamal ka hai!",
    talent: "🎨 *Talent!* Qudrati salahiyat aap mein koot koot kar bhari hai!",
    skillful: "🛠️ *Skillful!* Hunar mand log hi duniya badalte hain!",
    awesome: "🤩 *Awesome!* You are simply awesome!",
    wonderful: "🌈 *Wonderful!* Aap se mil kar dil khush ho gaya!",
    fantastic: "🚀 *Fantastic!* Kya fantastic andaaz hai aap ka!",
    excellence: "🥇 *Excellence!* Mayar aur miyaar — dono aap ke paas!",
    perfect: "💯 *Perfect!* 100 mein se 100, perfect score!",
    blessed: "🙏 *Blessed!* Allah aap ko hamesha khush rakhe. Ameen!",
};

async function respectCommand(sock, from, msg, commandName) {
    const key = String(commandName || '').toLowerCase();
    const text = RESPONSES[key];
    if (!text) return;
    const branded = text + '\n\n> *© POWERED BY MR MUAVIA MD BOT*';
    try {
        await sock.sendMessage(from, { text: branded }, { quoted: msg });
    } catch (e) {
        console.error('Respect command error:', e.message);
    }
}

respectCommand.TRIGGERS = Object.keys(RESPONSES);

module.exports = respectCommand;
