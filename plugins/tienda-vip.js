import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: 'tienda',
    alias: ['shop', 'store'],

    async execute(sock, msg, { replyWithContext, senderJid }) {
        let caption = `╭─「 🛒 TIENDA ECONOMY 」─╮\n`;
        caption += `│\n`;
        caption += `│💎 *VIP* | 50,000 Coins\n`;
        caption += `│ >+50% en.daily para siempre\n`;
        caption += `│ >Tag 💎 en tu.perfil\n`;
        caption += `│\n`;
        caption += `│Usa:.buy vip\n`;
        caption += `╰───────────────────╯`;

        replyWithContext(caption, [senderJid]);
    }
};