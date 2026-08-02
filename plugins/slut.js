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
    name: 'slut', alias: ['prostituirce'],
    async execute(sock, msg, { senderNumber, pushName, replyWithContext, senderJid }) {
        const db = load();
        if (!db[senderNumber]) db[senderNumber] = createUser(senderNumber, pushName);
        const u = db[senderNumber];

        if (Date.now() - u.lastHustle < 15 * 60 * 1000)
            return replyWithContext(`🌌 Esperá 15 min para volver a buscarte la vida`, [senderJid]);

        const win = Math.random() < 0.7;
        let gain = 0;
        if (win) gain = Math.floor(Math.random() * 801) + 200;

        u.coins += gain;
        u.lastHustle = Date.now();
        save(db);

        win
       ? replyWithContext(`🌌 Te buscaste la vida y ganaste ${money(gain)} Coins\n👛 Billetera: ${money(u.coins)}`, [senderJid])
        : replyWithContext(`🌌 Nadie te dio nada hoy... 0 Coins`, [senderJid]);
    }
};