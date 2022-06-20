import { Client, Intents, MessageReaction } from 'discord.js'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path/posix'
dotenv.config()
import { create_user_error, ICommandHandler, IMenuHandler, initialize_folders } from './globals'
import Collection from '@discordjs/collection'
import MessageHandler from './message'
import ButtonHandler from './interaction.button'
import SelectionHandler from './interaction.selection'

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
	// partials: ['MESSAGE', 'REACTION'],
})

initialize_folders()

//
{
	console.log('🔃 Loading message handlers...')

	client.on('messageCreate', async (message) => {
		if (!message) return
		await MessageHandler.onCreate({ client, message })
	})
	client.on('messageUpdate', async (old_message, message) => {
		if (!old_message || !message) return
		const o = old_message.partial ? await old_message.fetch() : old_message
		const m = message.partial ? await message.fetch() : message
		await MessageHandler.onEdit({ client, old_message: o, message: m })
	})
	client.on('messageDelete', async (message) => {
		if (!message) return
		const m = message.partial ? await message.fetch() : message
		await MessageHandler.onDestroy({ client, message: m })
	})

	client.on('messageReactionAdd', async (reaction, user) => {
		if (!reaction || !user) return
		const r = reaction.partial ? await reaction.fetch() : reaction
		const u = user.partial ? await user.fetch() : user
		await MessageHandler.onReactionCreate({ client, reaction: r, user: u })
	})
	client.on('messageReactionRemove', async (reaction, user) => {
		if (!reaction || !user) return
		const r = reaction.partial ? await reaction.fetch() : reaction
		const u = user.partial ? await user.fetch() : user
		await MessageHandler.onReactionRemove({ client, reaction: r, user: u })
	})
	client.on('messageReactionRemoveAll', async (message, reactions) => {
		if (!message || !reactions) return
		const m = message.partial ? await message.fetch() : message
		const r = new Collection<string, MessageReaction>()
		reactions.forEach((v, k) => r.set(k, v))
		await MessageHandler.onReactionRemoveBulk({ client, message: m, reactions: r })
	})
}

//
;(async () => {
	console.log('🔃 Loading interaction handlers...')
	const slashInteractions = new Collection<string, ICommandHandler>()
	const menuInteractions = new Collection<string, IMenuHandler>()

	// Slash
	{
		const commandPath = path.join(__dirname, 'commands/')
		if (fs.existsSync(commandPath)) {
			for (const file of fs.readdirSync(commandPath)) {
				if (!path.extname(file)) {
					for (const subFile of fs.readdirSync(commandPath + file)) {
						if (path.basename(subFile, path.extname(subFile)) === '[index]') continue
						if (!path.extname(subFile)) {
							for (const subSubFile of fs.readdirSync(commandPath + file + '/' + subFile)) {
								if (path.basename(subSubFile, path.extname(subSubFile)) === '[index]') continue
								const { Handler } = await import(commandPath + file + '/' + subFile + '/' + subSubFile)
								slashInteractions.set(
									file + ' ' + subFile + ' ' + path.basename(subSubFile, path.extname(subSubFile)),
									Handler
								)
							}
						} else {
							const { Handler } = await import(commandPath + file + '/' + subFile)
							slashInteractions.set(file + ' ' + path.basename(subFile, path.extname(subFile)), Handler)
						}
					}
				} else {
					const { Handler } = await import(commandPath + file)
					slashInteractions.set(path.basename(file, path.extname(file)), Handler)
				}
			}
		}
	}
	// Menu
	{
		const commandPath = path.join(__dirname, 'menus/')
		if (fs.existsSync(commandPath)) {
			for (const file of fs.readdirSync(commandPath)) {
				const { Handler } = await import(commandPath + file)
				menuInteractions.set(path.basename(file, path.extname(file)), Handler)
			}
		}
	}

	client.on('interactionCreate', async (i) => {
		if (!i) return

		if (i.isCommand()) {
			const commandName = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)]
				.filter((x) => x?.trim())
				.join(' ')
				.replace(/\\n/, '\n')
				.trim()
			if (!slashInteractions.get(commandName)) {
				const msg = create_user_error(`Could not find a slash handler for the command: \`${commandName}\``)
				await i.reply({
					content: msg,
					ephemeral: true,
				})
				return
			}

			await slashInteractions.get(commandName)!.Command({ client, interaction: i })
		} else if (i.isButton()) {
			await ButtonHandler({ client, interaction: i })
		} else if (i.isSelectMenu()) {
			await SelectionHandler({ client, interaction: i })
		} else if (i.isContextMenu()) {
			const commandName = i.commandName
			if (!menuInteractions.get(commandName)) {
				const msg = create_user_error(`Could not find a menu handler for the command: \`${commandName}\``)
				await i.reply({
					content: msg,
					ephemeral: true,
				})
				return
			}

			await menuInteractions.get(commandName)!.Command({ client, interaction: i })
		}
	})
})()

//

client.once('ready', () => {
	console.log('👍 Bot is active!')
})

console.log('🔃 Logging in...')
client.login(process.env.BOT_TOKEN)
