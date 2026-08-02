import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.join(__dirname, '../../databases/economy.json');

const loadEconomy = () => fs.existsSync(ECONOMY_FILE)? JSON.parse(fs.readFileSync(ECONOMY_FILE)) : {};
const saveEconomy = (d) => fs.writeFileSync(ECONOMY_FILE, JSON.stringify(d, null, 2));
const money = (n) => Number(n || 0).toLocaleString('es-AR');

export default {
    name: 'withdraw',
    alias: ['wit', 'retirar'],

    async execute(sock, msg, { args, senderNumber, replyWithContext, senderJid }) {
        const db = loadEconomy();
        if (!db[senderNumber]) return replyWithContext(`❌ Usa.bank primero para crear cuenta`, [senderJid]);
        const user = db[senderNumber];

        let amount = args[0]?.toLowerCase() === 'all'? user.bank : parseInt(args[0]);
        if (!amount || amount <= 0) return replyWithContext(`❌ Usa:.wit <monto> | all`, [senderJid]);
        if (user.bank < amount) return replyWithContext(`❌ No tenés ${money(amount)} en el banco`, [senderJid]);

        user.bank -= amount;
        user.coins += amount;
        saveEconomy(db);

        return replyWithContext(
            `╭─「 💵 RETIRO 」─╮\n│💵 Sacaste: ${money(amount)}\n│👛 Billetera: ${money(user.coins)}\n│🏦 Banco: ${money(user.bank)}\n╰────────────────╯`,
            [senderJid]
        );
    }
};