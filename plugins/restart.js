export default {
    name: 'restart',
    alias: ['reiniciar', 'reboot'],
    description: 'Reinicia el bot (solo owner)',
    category: 'owner',
    
    async execute(sock, msg, options) {
        try {
            const { config, isOwner, replyWithContext } = options;
            
            // Solo el owner puede usar este comando
            if (!isOwner) {
                return await replyWithContext(`🌌 El comando \`${config.prefix}restart\` Es solo para owner.\n> Usa ${config.prefix}help para ver mis comandos`);
            }
            
            await replyWithContext(`🌌 Reiniciando el Socket...\n> *Espere un momento...*`);
            
            setTimeout(() => {
                if (process.send) {
                    process.send("restart");
                } else {
                    process.exit(0);
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error en restart:', error);
            
            try {
                const { replyWithContext } = options;
                await replyWithContext(`❌ Error: ${error.message}`);
            } catch (e) {}
        }
    }
};