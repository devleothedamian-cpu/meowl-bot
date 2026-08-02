import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.join(__dirname, '../databases/economy.json');

const loadEconomy = () => fs.existsSync(ECONOMY_FILE)? JSON.parse(fs.readFileSync(ECONOMY_FILE)) : {};
const createUser = (num, name) => ({
    number: num, name: name||'Usuario', coins: 0, bank: 0,
    lastWork: 0, lastMine: 0, lastHustle: 0, lastCrime: 0, lastRob: 0, lastDaily: 0
});

const getCD = (last, cdMin) => {
    const diff = cdMin * 60 * 1000 - (Date.now() - last);
    if (diff <= 0) return '✅ Listo';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return h > 0? `${h}h ${m}m` : `${m}m ${s}s`;
};

export default {
    name: 'einfo',
    alias: ['cd', 'cooldown'],

    async execute(sock, msg, { senderNumber, pushName, replyWithContext, senderJid }) {
        const db = loadEconomy();
        if (!db[senderNumber]) db[senderNumber] = createUser(senderNumber, pushName);
        const u = db[senderNumber];

        let text = `╭─「 ⏳ COOLDOWNS ECO 」─╮\n`;
        text += `│👤 ${u.name}\n`;
        text += `├───────────────────────\n`;
        text += `│.work : ${getCD(u.lastWork, 5)}\n`;
        text += `│.mine : ${getCD(u.lastMine, 10)}\n`;
        text += `│.slut : ${getCD(u.lastHustle, 15)}\n`;
        text += `│.crime : ${getCD(u.lastCrime, 20)}\n`;
        text += `│.robar : ${getCD(u.lastRob, 30)}\n`;
        text += `│.daily : ${getCD(u.lastDaily, 1440)}\n`;
        text += `╰───────────────────────╯`;

        return replyWithContext(text, [senderJid]);
    }
};