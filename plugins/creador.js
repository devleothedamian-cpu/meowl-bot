import { ownerNumber, ownerName } from '../../config.js' // si lo tienes en config

export default {
    name: 'creador',
    alias: ['owner', 'contacto'],
    category: 'Info',
    description: 'Muestra el contacto del creador del bot',

    async execute(sock, msg, options) {
        const { config } = options;
        const chatId = msg.key.remoteJid;

        const ownerNumber = "5492645746772@s.whatsapp.net"; // Número del dueño en formato WhatsApp
        const ownerName = "—͟͞DEV LEO xz 🤖"; // Nombre que aparecerá en el contacto
        const messageText = `📞 *Contacto del Creador:*\n
Si tienes dudas, preguntas o sugerencias sobre el bot, puedes contactar a mi creador.

📌 *Nombre:* —͟͞DEV LEO
📌 *Número:* +54 9 2645746772
💬 *Mensaje directo:* Pulsa sobre el contacto y chatea con él.`;

        // 🧾 Enviar vCard del creador
        await sock.sendMessage(chatId, {
            contacts: {
                displayName: ownerName,
                contacts: [{
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${ownerName}\nTEL;waid=${ownerNumber.split('@')[0]}:+${ownerNumber.split('@')[0]}\nEND:VCARD`
                }]
            }
        });

        // 💬 Mensaje con texto explicativo
        await sock.sendMessage(chatId, { text: messageText }, { quoted: msg });
    }
};