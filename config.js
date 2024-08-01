export const storeFilePath = 'database/store.json'

export const logger = {
	info(...args) {
		console.log(
			chalk.bold.bgRgb(51, 204, 51)('INFO '),
			`[${chalk.rgb(255, 255, 255)(new Date().toLocaleString())}]:\n`,
			chalk.cyan(format(...args))
		)
	},
	error(...args) {
		console.log(
			chalk.bold.bgRgb(247, 38, 33)('ERROR '),
			`[${chalk.rgb(255, 255, 255)(new Date().toLocaleString())}]:\n`,
			chalk.rgb(255, 38, 0)(format(...args))
		)
	},
	warn(...args) {
		console.log(
			chalk.bold.bgRgb(255, 153, 0)('WARNING '),
			`[${chalk.rgb(255, 255, 255)(new Date().toLocaleString())}]:\n`,
			chalk.redBright(format(...args))
		)
	},
	trace(...args) {
		console.log(
			chalk.grey('TRACE '),
			`[${chalk.rgb(255, 255, 255)(new Date().toLocaleString())}]:\n`,
			chalk.white(format(...args))
		)
	},
	debug(...args) {
		console.log(
			chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
			`[${chalk.rgb(255, 255, 255)(new Date().toLocaleString())}]:\n`,
			chalk.white(format(...args))
		)
	}
}

export default {
	storeFilePath,
	logger
}