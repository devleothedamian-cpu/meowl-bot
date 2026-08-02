import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ECONOMY_FILE = path.join(__dirname, '..', 'databases', 'economy.json');

// Función para cargar y guardar (usando tu lógica)
function loadEconomy() {
    try {
        if (fs.existsSync(ECONOMY_FILE)) return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf8'));
        return {};
    } catch { return {}; }
}

function saveEconomy(data) {
    fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}

export default {
    name: 'ppt',
    alias: ['bet'],

    execute: async (sock, msg, options) => {
        const { senderNumber, args, replyWithContext, senderJid, pushName } = options;

        try {
            const economy = loadEconomy();
            const user = economy[senderNumber];

            if (!user) return replyWithContext('❌ Primero debes estar registrado o tener una cuenta en el banco.', [senderJid]);

            const usage = `🎮 *Piedra, Papel o Tijera* 🎮\n\nUso: .ppt <elección> <apuesta>\nEjemplo: *.ppt piedra 500*`;
            
            if (!args[0] || !args[1]) return replyWithContext(usage, [senderJid]);

            const eleccionUser = args[0].toLowerCase();
            const apuesta = parseInt(args[1]);
            const opciones = ['piedra', 'papel', 'tijera'];

            if (!opciones.includes(eleccionUser)) return replyWithContext('❌ Elige entre: piedra, papel o tijera.', [senderJid]);
            if (isNaN(apuesta) || apuesta <= 0) return replyWithContext('❌ Ingresa una cantidad de coins válida para apostar.', [senderJid]);
            if (user.coins < apuesta) return replyWithContext(`❌ No tienes suficientes coins. Saldo: *${user.coins}*`, [senderJid]);

            // Lógica del Bot
            const eleccionBot = opciones[Math.floor(Math.random() * opciones.length)];
            let resultado = '';
            let win = false;
            let empate = false;

            if (eleccionUser === eleccionBot) {
                empate = true;
                resultado = '¡EMPATE! 🤝';
            } else if (
                (eleccionUser === 'piedra' && eleccionBot === 'tijera') ||
                (eleccionUser === 'papel' && eleccionBot === 'piedra') ||
                (eleccionUser === 'tijera' && eleccionBot === 'papel')
            ) {
                win = true;
                resultado = '¡GANASTE! 🎉';
            } else {
                resultado = 'PERDISTE 🤡';
            }

            // Actualizar Economía
            if (win) {
                user.coins += apuesta;
                // Pequeña chance de ganar un mineral por la suerte
                if (Math.random() > 0.9) {
                    user.minerals.oro += 1;
                    resultado += '\n🎁 ¡Bonus! Encontraste 1 de Oro.';
                }
            } else if (!empate) {
                user.coins -= apuesta;
            }

            saveEconomy(economy);

            const icons = { piedra: '🗿', papel: '📄', tijera: '✂️' };
            const mssg = `🕹️ *Juego de PPT* 🕹️\n` +
                         `> *Tú:* ${icons[eleccionUser]} ${eleccionUser}\n` +
                         `> *Bot:* ${icons[eleccionBot]} ${eleccionBot}\n\n` +
                         `✨ *Resultado:* ${resultado}\n` +
                         `${empate ? 'Tus coins siguen iguales.' : (win ? `Ganaste: *+${apuesta} coins*` : `Perdiste: *-${apuesta} coins*`)}\n` +
                         `💰 *Saldo actual:* ${user.coins}`;

            await replyWithContext(mssg, [senderJid]);

        } catch (error) {
            console.error('Error en PPT:', error);
            replyWithContext('❌ Hubo un error al procesar el juego.', [senderJid]);
        }
    }
}