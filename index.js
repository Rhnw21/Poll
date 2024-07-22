import { Browsers, makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import { config } from 'dotenv'
import chalk from 'chalk'
import pino from 'pino'

config()

const prefix = process.env.PREFIX || '.'
const mongoUrl = process.env.MONGO_URL
const logger = pino({ level: 'silent' })

const startSock = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('autb')
    const sock = makeWASocket({
      logger,
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: true,
      auth: state
    })
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut
        if (shouldReconnect) {
          startSock()
        }
      } else if (connection === 'open') {
        console.log(chalk.bgGreen('isOpen'))
      }
    })
    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0]
      if (!msg.message) return

      const messageType = Object.keys(msg.message)[0]
      const sender = msg.key.remoteJid
      const text = msg.message.conversation || msg.message.extendedTextMessage.text
     
      console.log(`New message from ${sender} (type: ${messageType}): ${text}`);

      if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
        if (text.startsWith(prefix)) {
          const command = text.slice(prefix.length).trim().toLowerCase()
          const chatId = msg.key.remoteJid

          switch (command) {
            case 'ping':
              await sock.sendMessage(chatId, { text: 'OK' })
              break
            default:
              await sock.sendMessage(chatId, { text: 'Perintah tidak dikenal' })
              break
          }
        }
      }
    })
    setInterval(() => {
      const d = new Date()
      if (`${d.getHours()}:${d.getMinutes()}` === '7:0') {
        const chatId = '120363293830779887'
        const pollValues = ['Isuk', 'Awan', 'Mole']
        sock.sendMessage(chatId, {
          poll: { name: 'Absen', values: pollValues, selectableCount: 1 }
        })
      }
    }, 60 * 1000)
  
    return sock
  } catch (error) {
    console.log(error)
    setTimeout(() => startSock(), 5000)
  }
}

startSock()