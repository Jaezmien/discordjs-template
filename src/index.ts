import { Client, Intents } from 'discord.js'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path/posix'
dotenv.config()
import { ICommandHandler } from './globals'

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

//

;(async () => {
	const interactions: { [key: string]: ICommandHandler } = {}
	const commandPath = path.join(__dirname, 'commands/')
	const interactionFiles = fs.readdirSync(commandPath)
	for (const file of interactionFiles) {
		const { Handler } = await import(commandPath + '/' + file)
		interactions[path.basename(file, path.extname(file))] = Handler
	}
	client.on('interactionCreate', (i) => {
		if (!i.isCommand()) return
		const commandName = [
			i.commandName,
			i.options.getSubcommandGroup(false),
			i.options.getSubcommand(false),
		]
			.filter((x) => x?.trim())
			.join(' ')
			.replace(/\\n/, '\n')
			.trim()
		if (!interactions[commandName]) {
			i.reply({
				content: `Could not find a handler for the command: \`${commandName}\``,
				ephemeral: true,
			})
			return
		}

		try {
			interactions[commandName].Command({
				client,
				interaction: i,
			})
		} catch (e) {
			console.error(e)
		}
	})
})()

//

client.once('ready', () => {
	console.log('Bot is active!')
})

client.login(process.env.BOT_TOKEN)
