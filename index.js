import {
	Browsers,
	makeWASocket,
	useMultiFileAuthState,
	DisconnectReason,
	makeInMemoryStore,
	PHONENUMBER_MCC
} from '@whiskeysockets/baileys'

import pino from 'pino'
import chalk from 'chalk'
import { createInterface } from 'readline'
import { existsSync, promises as fs } from 'fs'

import Config from './config.js'

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const rl = createInterface(process.stdin, process.stdout)
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

let interval
const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(Config.session)
	const sock = makeWASocket({
		logger: pino({ level: 'silent' }),
		printQRInTerminal: false,
		browser: Browsers.ubuntu('Chrome'),
		auth:state
	})
	
	store.bind(sock.ev)
	store.readFromFile(Config.storeFilePath)
	
	if (!sock.authState.creds.registered) {
		console.clear()
		let number = await question(chalk.bgBlack(chalk.greenBright('Silahkan masukan Nomor WhatsApp Anda :\n> ')))
		number = number.replace(/[^0-9]/g, '') || ''
		if (number.startsWith('0')) number = number.replace('0', '62')
		if (!Object.keys(PHONENUMBER_MCC).some(v => String(number).startsWith(v))) {
			console.log(chalk.bgBlack(chalk.redBright('Mulailah dengan kode WhatsApp negara Anda, Contoh: 62xxx')))
			number = await question(chalk.bgBlack(chalk.greenBright('Silahkan masukan Nomor WhatsApp Anda :\n> ')))
			number = number.replace(/[^0-9]/g, '')
		}
    
		try {
			const code = await sock.requestPairingCode(number)
			console.log(number)
			console.log(chalk.black(chalk.bgGreen('Pairing code kamu : ')), chalk.black(chalk.white(parse(code))))
		} catch (e) {
			throw new Error(e)
		}
	}
	
	if (interval) clearInterval(interval)
	interval = setInterval(() => store.writeToFile(Config.storeFilePath), 10000)
	
	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		const status = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
		const statusMessage = lastDisconnect?.error?.output?.message || lastDisconnect?.error?.output?.payload?.message
		if (status) {
			Config.logger.warn(`\nstatus: ${status}\nmessage: ${statusMessage}\nreason: ${DisconnectReason[status]}`.trim())
			if (
				status !== DisconnectReason.loggedOut &&
				status !== DisconnectReason.connectionReplaced &&
				status !== DisconnectReason.multideviceMismatch &&
				status !== DisconnectReason.forbidden &&
				status !== DisconnectReason.badSession
			) {
				Config.logger.info('Reloading..')
				startSock()
			} else if (
				status == DisconnectReason.forbidden ||
				status == DisconnectReason.loggedOut ||
				status == DisconnectReason.badSession
			) {
				Config.logger.error('Reason:', DisconnectReason[status])
				try {
					Promise.all([Config.session, Config.storeFilePath]
						.filter(file => existsSync(file))
						.map(file => fs.rm(file, { recursive: true }))
					)
				} catch (e) {
					config.logger.error(e)
				}
				
				try { this.ws.close() } catch { }
				this.ws.removeAllListeners()
				
				process.exit(0)
			}
		}
	})
	
	sock.ev.on('messages.upsert', async (m) => {
		const msg = m.messages[0]
		console.log(JSON.stringify(msg, null, 2))
	})
	
	sock.ev.on('creds.update', saveCreds)
	
	setInterval(() => {
	  const d = new Date()
	  const currentTime = `${d.getHours()}:${d.getMinutes()}`
	  if (currentTime === '7:30' || currentTime === '11:30' || currentTime === '16:30') {
	    const chatId = '120363045832731477@g.us'
	    sock.sendMessage(chatId, {
	      text: 'Wts Yt Famhead 4k/Jaspay, Pm!'
	    })
	  }
	}, 60 * 1000)
	
	return sock
}

startSock()

function parse(code) {
	let res = code = code?.match(/.{1,4}/g)?.join?.('-') || null
	if (!res) {
		let bagi = code.length / 2
		let a = code.slice(0, bagi)
		let b = code.slice(bagi, code.length)
		res = a + '-' + b
	}
	return res || code
}