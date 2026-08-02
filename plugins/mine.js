import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.join(__dirname, '../databases/economy.json');

const load = () => fs.existsSync(ECONOMY_FILE)? JSON.parse(fs.readFileSync(ECONOMY_FILE)) : {};
const save = (d) => fs.writeFileSync(ECONOMY_FILE, JSON.stringify(d, null, 2));
const money = (n) => Number(n).toLocaleString('es-AR');

const createUser = (num, name) => ({
    number: num, name: name||'Usuario', coins: 0, bank: 0,
    genero: 'No definido', edad: 0, casado: null, vip: false,
    lastWork: 0, lastMine: 0, lastHustle: 0, lastCrime: 0, lastRob: 0, lastDaily: 0
});

export default {
    name: 'mine', alias: ['minar'],
    async execute(sock, msg, { senderNumber, pushName, replyWithContext, senderJid }) {
        const db = load();
        if (!db[senderNumber]) db[senderNumber] = createUser(senderNumber, pushName);
        const u = db[senderNumber];

        if (Date.now() - u.lastMine < 10 * 60 * 1000)
            return replyWithContext(`⛏️ Esperá 10 min para volver a minar`, [senderJid]);

        const gain = Math.floor(Math.random() * 701) + 100;
        u.coins += gain;
        u.lastMine = Date.now();
        save(db);

        replyWithContext(`⛏️ Minas y sacás ${money(gain)} Coins\n👛 Billetera: ${money(u.coins)}`, [senderJid]);
    }
};