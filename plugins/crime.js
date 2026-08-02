import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, '../database/economy.json')

const load = () => fs.existsSync(dbPath)? JSON.parse(fs.readFileSync(dbPath)) : {}
const save = (d) => {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    fs.writeFileSync(dbPath, JSON.stringify(d, null, 2))
}

const createUser = (db, id) => {
    db[id] ||= { coins: 0, lastWork: 0, lastCrime: 0, lastDaily: 0, lastWeekly: 0, lastSlut: 0, lastCofre: 0 }
}

export default {
    name: 'crime',
    alias: ['robar', 'delito'],
    description: 'Robale a alguien. 50% de ganar 300-1200, 50% de perder 200-800. CD: 20min',
    category: 'economy',

    async execute(sock, msg, { replyWithContext, senderJid }) {
        const db = load()
        createUser(db, senderJid)
        const user = db[senderJid]

        const CD = 20 * 60 * 1000
        const diff = Date.now() - user.lastCrime
        if (diff < CD) return replyWithContext(`⏳ Espera *${Math.ceil((CD-diff)/60000)} min* para delinquir otra vez`, [senderJid])

        const win = Math.random() < 0.5
        if (win) {
            const ganancia = Math.floor(Math.random() * 901) + 300 // 300-1200
            user.coins += ganancia
            user.lastCrime = Date.now()
            save(db)
            replyWithContext(`💰 *CRIME EXITOSO*\n\nRobaste *${ganancia} Coins* 🤑\nSaldo: ${user.coins}`, [senderJid])
        } else {
            const perdida = Math.floor(Math.random() * 601) + 200 // 200-800
            user.coins = Math.max(0, user.coins - perdida)
            user.lastCrime = Date.now()
            save(db)
            replyWithContext(`👮 *TE ATRAPARON*\n\nPerdiste *${perdida} Coins* 💸\nSaldo: ${user.coins}`, [senderJid])
        }
    }
}