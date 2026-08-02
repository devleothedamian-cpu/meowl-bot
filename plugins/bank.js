import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.resolve(__dirname, '../databases/economy.json'); // RESOLVE

const load = () => fs.existsSync(ECONOMY_FILE)? JSON.parse(fs.readFileSync(ECONOMY_FILE)) : {};
const save = (d) => fs.writeFileSync(ECONOMY_FILE, JSON.stringify(d, null, 2));
const money = (n) => Number(n).toLocaleString('es-AR');
const cleanNum = (num) => String(num).replace(/\D/g, '');

const createUser = (num, name) => ({
    number: num, name: name||'Usuario', coins: 0, bank: 0,
    genero: 'No definido', edad: 0, casado: null, vip: false,
    lastWork: 0, lastMine: 0, lastHustle: 0, lastCrime: 0, lastRob: 0, lastDaily: 0
});

export default {
    name: 'work',
    alias: ['w'],
    category: 'economy',
    description: 'Trabaja y gana 100 a 400 Coins cada 5 min',
    async execute(sock, msg, { senderNumber, pushName, replyWithContext, senderJid }) {
        const myNum = cleanNum(senderNumber);
        const db = load();
        console.log('WORK GUARDANDO EN:', ECONOMY_FILE, 'ID:', myNum) // DEBUG
        if (!db[myNum]) db[myNum] = createUser(myNum, pushName);
        const u = db[myNum];

        if (Date.now() - u.lastWork < 5 * 60 * 1000) {
            const timeLeft = 5 * 60 * 1000 - (Date.now() - u.lastWork);
            const min = Math.floor(timeLeft / 60000);
            const sec = Math.floor((timeLeft % 60000) / 1000);
            return replyWithContext(`⏳ Esperá ${min}m ${sec}s para volver a trabajar`, [senderJid]);
        }

        const gain = Math.floor(Math.random() * 301) + 100;
        u.coins += gain;
        u.lastWork = Date.now();
        save(db);

        replyWithContext(`💼 Trabajaste y ganaste ${money(gain)} Coins\n👛 Billetera: ${money(u.coins)}`, [senderJid]);
    }
};