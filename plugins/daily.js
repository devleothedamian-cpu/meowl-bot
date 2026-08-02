import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.join(__dirname, '../databases/economy.json');
const DAY = 24 * 60 * 60 * 1000; // 24 horas en ms

const load = () => fs.existsSync(ECONOMY_FILE)? JSON.parse(fs.readFileSync(ECONOMY_FILE)) : {};
const save = (d) => fs.writeFileSync(ECONOMY_FILE, JSON.stringify(d, null, 2));
const money = (n) => Number(n).toLocaleString('es-AR');
const msToTime = (ms) => {
    let s = Math.floor(ms / 1000);
    let h = Math.floor(s / 3600); s %= 3600;
    let m = Math.floor(s / 60); s %= 60;
    return `${h}h ${m}m ${s}s`;
};

const createUser = (num, name) => ({
    number: num, name: name||'Usuario', coins: 0, bank: 0,
    genero: 'No definido', edad: 0, casado: null, vip: false,
    lastWork: 0, lastMine: 0, lastHustle: 0, lastCrime: 0, lastRob: 0, lastDaily: 0
});

export default {
    name: 'daily',
    alias: ['diario'],

    async execute(sock, msg, { senderNumber, pushName, replyWithContext, senderJid }) {
        const db = load();
        if (!db[senderNumber]) db[senderNumber] = createUser(senderNumber, pushName);
        const u = db[senderNumber];

        const timeLeft = DAY - (Date.now() - u.lastDaily);
        if (timeLeft > 0)
            return replyWithContext(`📅 Ya cobraste hoy.\n⏳ Volve en: ${msToTime(timeLeft)}`, [senderJid]);

        const gain = Math.floor(Math.random() * 1001) + 500; // 500 a 1500
        u.coins += gain;
        u.lastDaily = Date.now();
        save(db);

        replyWithContext(`🎁 Reclamas tu Daily\n💰 Ganaste: ${money(gain)} Coins\n👛 Billetera: ${money(u.coins)}`, [senderJid]);
    }
};