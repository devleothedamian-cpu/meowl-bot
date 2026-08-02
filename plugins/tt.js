import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const API_URL = 'https://api.yupra.my.id/api/downloader/tiktok';

export default {
    name: 'tt',
    alias: ['tiktok', 'tiktokdl'],
    
    async execute(sock, msg, options) {
        try {
            const { args, config, pushName, senderNumber, senderJid } = options;
            const from = msg.key.remoteJid;
            const url = args[0];

            if (!url) {
                return await sock.sendMessage(from, {
                    text: "🍒 Debes proporcionar un link de TikTok\n> Uso: $tt [enlace]",
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            }

            if (!url.includes('tiktok.com')) {
                return await sock.sendMessage(from, {
                    text: "🍒 Eso no parece ser un enlace de TikTok válido",
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            }

            try {
                await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });
            } catch (e) {}

            console.log(`🎬 TT: ${url} por ${pushName || senderNumber}`);

            const encodedUrl = encodeURIComponent(url);
            const response = await axios.get(`${API_URL}?url=${encodedUrl}`, { timeout: 30000 });
            
            if (!response.data?.status || !response.data?.result) {
                throw new Error('No se pudo obtener datos del video');
            }
            
            const data = response.data.result;
            const videoData = data.data || [];
            
            // Buscar video sin marca de agua (prioridad: nowatermark_hd > nowatermark > watermark)
            let videoUrl = null;
            for (const v of videoData) {
                if (v.type === 'nowatermark_hd' || v.type === 'nowatermark') {
                    videoUrl = v.url;
                    break;
                }
            }
            if (!videoUrl && videoData[0]) videoUrl = videoData[0].url;
            
            if (!videoUrl) throw new Error('No se pudo obtener el enlace del video');

            const tempDir = path.join(__dirname, '..', 'tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const autor = data.author?.nickname || 'Desconocido';
            const titulo = data.title || 'Sin título';
            const duracion = data.duration || 'N/A';
            
            // Obtener estadísticas de la API (pueden estar en diferentes lugares)
            let vistas = 'N/A';
            let comentarios = 'N/A';
            let likes = 'N/A';
            
            // Intentar obtener de stats
            if (data.stats) {
                vistas = data.stats.play_count || data.stats.playCount || data.stats.views || 'N/A';
                comentarios = data.stats.comment_count || data.stats.commentCount || data.stats.comments || 'N/A';
                likes = data.stats.digg_count || data.stats.diggCount || data.stats.likes || 'N/A';
            }
            
            // Si no hay stats, intentar obtener de otras propiedades
            if (vistas === 'N/A' && data.play_count) vistas = data.play_count;
            if (comentarios === 'N/A' && data.comment_count) comentarios = data.comment_count;
            if (likes === 'N/A' && data.digg_count) likes = data.digg_count;
            
            // Formatear números
            if (vistas !== 'N/A') vistas = Number(vistas).toLocaleString();
            if (comentarios !== 'N/A') comentarios = Number(comentarios).toLocaleString();
            if (likes !== 'N/A') likes = Number(likes).toLocaleString();
            
            const fecha = data.taken_at || 'N/A';

            console.log(`📥 Descargando video: ${videoUrl}`);
            
            const tempFile = path.join(tempDir, `tiktok_${Date.now()}.mp4`);
            const convertedFile = path.join(tempDir, `tiktok_conv_${Date.now()}.mp4`);
            
            // Descargar el video con reintentos
            let retries = 3;
            let downloaded = false;
            
            while (retries > 0 && !downloaded) {
                try {
                    const writer = fs.createWriteStream(tempFile);
                    const videoResponse = await axios({
                        method: 'get',
                        url: videoUrl,
                        responseType: 'stream',
                        timeout: 60000,
                        maxRedirects: 5,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    videoResponse.data.pipe(writer);
                    
                    await new Promise((resolve, reject) => {
                        writer.on('finish', resolve);
                        writer.on('error', reject);
                    });
                    
                    downloaded = true;
                } catch (err) {
                    retries--;
                    console.log(`Reintento ${3 - retries}...`);
                    if (retries === 0) throw err;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
            
            const stats = fs.statSync(tempFile);
            const sizeMB = stats.size / (1024 * 1024);
            console.log(`✅ Video descargado: ${sizeMB.toFixed(2)} MB`);
            
            if (stats.size < 1000) {
                throw new Error('Archivo demasiado pequeño');
            }
            
            if (sizeMB > 100) {
                return await sock.sendMessage(from, {
                    text: "🌹 El vídeo es demasiado pesado (máx 100MB)",
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            }
            
            // Convertir video a formato compatible con WhatsApp
            console.log(`🔄 Convirtiendo video a formato compatible...`);
            
            try {
                const ffmpegCmd = `ffmpeg -i "${tempFile}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p -r 30 "${convertedFile}" -y`;
                await execAsync(ffmpegCmd);
                
                const convertedStats = fs.statSync(convertedFile);
                console.log(`✅ Video convertido: ${(convertedStats.size / 1024 / 1024).toFixed(2)} MB`);
                
                let videoBuffer = fs.readFileSync(convertedFile);
                
                // Si el video es muy grande, comprimir más
                if (convertedStats.size > 16 * 1024 * 1024) {
                    console.log(`⚠️ Video muy grande, comprimiendo más...`);
                    const compressedFile = path.join(tempDir, `tiktok_comp_${Date.now()}.mp4`);
                    await execAsync(`ffmpeg -i "${convertedFile}" -c:v libx264 -preset fast -crf 28 -c:a aac -b:a 96k -movflags +faststart -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p -r 25 "${compressedFile}" -y`);
                    videoBuffer = fs.readFileSync(compressedFile);
                    fs.unlinkSync(compressedFile);
                    console.log(`✅ Video comprimido: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
                }
                
                const caption = `*あ🏮 𝖠𝗎𝗍𝗈𝗋* : ${autor}\n*あ🏮 𝖳𝗂𝗍𝗎𝗅𝗈* : ${titulo}\n*あ🏮 𝖣𝗎𝗋𝖺𝖼𝗂𝗈́𝗇* : ${duracion}\n*あ🏮 𝖵𝗂𝗌𝗍𝖺𝗌* : ${vistas}\n*あ🏮 𝖢𝗈𝗆𝖾𝗇𝗍𝖺𝗋𝗂𝗈𝗌* : ${comentarios}\n*あ🏮 𝖫𝗂𝗄𝖾𝗌* : ${likes}\n*あ🏮 𝖥𝖾𝖼𝗁𝖺* : ${fecha}`;

                await sock.sendMessage(from, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    gifPlayback: false,
                    caption,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
                
            } catch (ffmpegError) {
                console.error('Error en conversión:', ffmpegError.message);
                // Si falla la conversión, intentar enviar el original
                const videoBuffer = fs.readFileSync(tempFile);
                
                const caption = `*あ🏮 𝖠𝗎𝗍𝗈𝗋* : ${autor}\n*あ🏮 𝖳𝗂𝗍𝗎𝗅𝗈* : ${titulo}\n*あ🏮 𝖣𝗎𝗋𝖺𝖼𝗂𝗈́𝗇* : ${duracion}\n*あ🏮 𝖵𝗂𝗌𝗍𝖺𝗌* : ${vistas}\n*あ🏮 𝖢𝗈𝗆𝖾𝗇𝗍𝖺𝗋𝗂𝗈𝗌* : ${comentarios}\n*あ🏮 𝖫𝗂𝗄𝖾𝗌* : ${likes}\n*あ🏮 𝖥𝖾𝖼𝗁𝖺* : ${fecha}\n⚠️ Video en formato original`;

                await sock.sendMessage(from, {
                    video: videoBuffer,
                    mimetype: 'video/mp4',
                    gifPlayback: false,
                    caption,
                    contextInfo: {
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.canalId || '',
                            serverMessageId: 0,
                            newsletterName: config.canalNombre || ''
                        },
                        forwardingScore: 9999999,
                        isForwarded: true
                    }
                }, { quoted: msg });
            }
            
            // Limpiar archivos
            setTimeout(() => {
                try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
                try { if (fs.existsSync(convertedFile)) fs.unlinkSync(convertedFile); } catch (e) {}
            }, 5000);
            
            try {
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            } catch (e) {}
            
            console.log(`✅ Video enviado: ${sizeMB.toFixed(2)}MB`);

        } catch (error) {
            console.error('❌ Error en comando tt:', error);
            
            try {
                await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            } catch (e) {}
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🍒 Error » ${error.message}`,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: options.config?.canalId || '',
                        serverMessageId: 0,
                        newsletterName: options.config?.canalNombre || ''
                    },
                    forwardingScore: 9999999,
                    isForwarded: true
                }
            }, { quoted: msg });
        }
    }
};