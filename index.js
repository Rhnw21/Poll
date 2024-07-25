import { Browsers, makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import chalk from 'chalk'
import pino from 'pino'

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
    setInterval(() => {
      const d = new Date()
      const currentTime = `${d.getHours()}:${d.getMinutes()}`
      if (currentTime === '7:30') {
        const chatId = '120363293830779887@g.us'
        const pollValues = ['Isuk', 'Awan', 'Mole']
        sock.sendMessage(chatId, {
          poll: { name: 'Absen', values: pollValues, selectableCount: 1 }
        })
        console.log(chalk.bgRed('Succes send Polling'))
      }
      if (currentTime === '7:30' || currentTime === '12:30' || currentTime === '16:30') {
        const chatId = '120363045832731477@g.us'
        sock.sendMessage(chatId, {
          text: 'Wts Yt Famhead 4k' }
        )
        console.log(chalk.bgRed('Succes send Promosi'))
      }
    }, 60 * 1000)
  } catch (error) {
    console.log(error)
  }
}

startSock()