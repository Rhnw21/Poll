import {
	Browsers,
	makeWASocket,
	DisconnectReason,
	PHONENUMBER_MCC
} from '@whiskeysockets/baileys'

import pino from 'pino'
import chalk from 'chalk'
import { Boom } from '@hapi/boom'
import { useMongoAuthState } from 'baileys-mongodb'
import { createInterface } from 'readline'

import Config from './config.js'

const rl = createInterface(process.stdin, process.stdout)
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

const startSock = async () => {
	const { state, saveCreds } = await useMongoAuthState(Config.URL_MONGO, {})
	const sock = makeWASocket({
		logger: pino({ level: 'silent' }),
		printQRInTerminal: false,
		browser: Browsers.ubuntu('Chrome'),
		auth:state
	})
	
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
	
	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		if (connection === 'close') {
			let reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.badSession || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionReplaced || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut) {
				startSock()
			}
		} else if (connection === 'open') {
			console.log('[Connected] ' + JSON.stringify(sock.user.id.split(':')[0], null, 2))
		}
	})
	
	sock.ev.on('creds.update', saveCreds)
	
	setInterval(() => {
	  const d = new Date()
	  const currentTime = `${d.getHours()}:${d.getMinutes()}`
	  if (currentTime === '7:30') {
	    const chatId = '120363293830779887@g.us'
	    const pollValues = ['Isuk', 'Awan']
	    sock.sendMessage(chatId, {
	      poll: { name: 'Absen', values: pollValues, selectableCount: 1 }
	    })
	  }
	  if (currentTime === '7:30' || currentTime === '11:30' || currentTime === '16:30') {
	    const chatId = '120363045832731477@g.us'
	    sock.sendMessage(chatId, {
	      text: 'Wts Yt Famhead 4k - Jaspay, Pm.'
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