import { Client, Intents, MessageReaction } from 'discord.js'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path/posix'
dotenv.config()
import { ICommandHandler } from './globals'
import Collection from '@discordjs/collection'
import MessageHandler from './message'
import ButtonHandler from './interaction.button'
import MenuHandler from './interaction.menu'

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	partials: ['MESSAGE', 'REACTION'],
})

//

;(async () => {
	console.log('🔃 Loading message handlers...')

	client.on('messageCreate', (message) => {
		if (!message) return
		MessageHandler.onCreate({ client, message })
	})
	client.on('messageUpdate', async (old_message, message) => {
		const o = old_message.partial ? await old_message.fetch() : old_message
		const m = message.partial ? await message.fetch() : message
		MessageHandler.onEdit({ client, old_message: o, message: m })
	})
	client.on('messageDelete', async (message) => {
		const m = message.partial ? await message.fetch() : message
		MessageHandler.onDestroy({ client, message: m })
	})

	client.on('messageReactionAdd', async (reaction, user) => {
		const r = reaction.partial ? await reaction.fetch() : reaction
		const u = user.partial ? await user.fetch() : user
		MessageHandler.onReactionCreate({ client, reaction: r, user: u })
	})
	client.on('messageReactionRemove', async (reaction, user) => {
		const r = reaction.partial ? await reaction.fetch() : reaction
		const u = user.partial ? await user.fetch() : user
		MessageHandler.onReactionRemove({ client, reaction: r, user: u })
	})
	client.on('messageReactionRemoveAll', async (message, reactions) => {
		const m = message.partial ? await message.fetch() : message
		const r = new Collection<string, MessageReaction>()
		reactions.forEach((v, k) => r.set(k, v))
		MessageHandler.onReactionRemoveBulk({ client, message: m, reactions: r })
	})
})()

//
;(async () => {
	console.log('🔃 Loading interaction handlers...')
	const interactions = new Collection<string, ICommandHandler>()
	const commandPath = path.join(__dirname, 'commands/')
	for (const file of fs.readdirSync(commandPath)) {
		if (!path.extname(file)) {
			for (const subFile of fs.readdirSync(commandPath + file)) {
				if (path.basename(subFile, path.extname(subFile)) === '[index]') continue
				if (!path.extname(subFile)) {
					for (const subSubFile of fs.readdirSync(commandPath + file + '/' + subFile)) {
						if (path.basename(subSubFile, path.extname(subSubFile)) === '[index]') continue
						const { Handler } = await import(commandPath + file + '/' + subFile + '/' + subSubFile)
						interactions.set(
							file + ' ' + subFile + ' ' + path.basename(subSubFile, path.extname(subSubFile)),
							Handler
						)
					}
				} else {
					const { Handler } = await import(commandPath + file + '/' + subFile)
					interactions.set(file + ' ' + path.basename(subFile, path.extname(subFile)), Handler)
				}
			}
		} else {
			const { Handler } = await import(commandPath + file)
			interactions.set(path.basename(file, path.extname(file)), Handler)
		}
	}
	client.on('interactionCreate', (i) => {
		if (i.isCommand()) {
			const commandName = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)]
				.filter((x) => x?.trim())
				.join(' ')
				.replace(/\\n/, '\n')
				.trim()
			if (!interactions.get(commandName)) {
				i.reply({
					content: `Could not find a handler for the command: \`${commandName}\``,
					ephemeral: true,
				})
				return
			}

			interactions.get(commandName)!.Command({ client, interaction: i })
		} else if (i.isButton()) {
			ButtonHandler({ client, interaction: i })
		} else if (i.isSelectMenu()) {
			MenuHandler({ client, interaction: i })
		}
	})
})()

//

client.once('ready', () => {
	console.log('👍 Bot is active!')
})

console.log('🔃 Logging in...')
client.login(process.env.BOT_TOKEN)
