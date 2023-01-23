import { Client, Collection, GatewayIntentBits, MessageReaction } from 'discord.js'
import dotenv from 'dotenv'
import path from 'path/posix'
import { Database } from './database'
import {
	CrawledPath,
	crawl_path,
	create_user_error,
	ICommandHandler,
	IMenuHandler,
	IModalHandler,
	initialize_folders,
} from './globals'
import ButtonHandler from './interaction.button'
import SelectionHandler from './interaction.selection'
import MessageHandler from './message'
dotenv.config()

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions],
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

async function register_interaction_handlers() {
	console.log('🔃 Loading interaction handlers...')
	const slashInteractions = new Collection<string, ICommandHandler>()
	const menuInteractions = new Collection<string, IMenuHandler>()
	const modalInteractions = new Collection<string, IModalHandler>()

	function remove_index_paths(paths: CrawledPath[]) {
		return paths.filter((p) => !(p.depth > 0 && path.basename(p.path, path.extname(p.path)) === '[index]'))
	}
	async function import_paths(
		paths: CrawledPath[],
		collection: Collection<string, any>,
		on_hit: (path: string) => Promise<[any] | [string, any]>
	) {
		for (const p of paths) {
			const selected = await on_hit(p.path)

			if (selected.length === 1) {
				collection.set(p.name, selected[0])
			} else {
				collection.set(selected[0], selected[1])
			}
		}
	}

	// Slash
	await import_paths(
		remove_index_paths(await crawl_path(path.join(__dirname, 'commands/'), 2)),
		slashInteractions,
		async (p) => [(await import(p)).Handler]
	)

	// Menu
	await import_paths(
		remove_index_paths(await crawl_path(path.join(__dirname, 'menus/'), 1)),
		menuInteractions,
		async (p) => [(await import(p)).Handler]
	)

	// Modals
	await import_paths(
		remove_index_paths(await crawl_path(path.join(__dirname, 'modals/'), 1)),
		modalInteractions,
		async (p) => {
			const { ModalID, Handler } = await import(p)
			return [ModalID, Handler]
		}
	)

	client.on('interactionCreate', async (i) => {
		if (!i) return

		if (i.isChatInputCommand()) {
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
		} else if (i.isUserContextMenuCommand()) {
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
		} else if (i.isAutocomplete()) {
			const commandName = [i.commandName, i.options.getSubcommandGroup(false), i.options.getSubcommand(false)]
				.filter((x) => x?.trim())
				.join(' ')
				.replace(/\\n/, '\n')
				.trim()

			if (slashInteractions.get(commandName) && slashInteractions.get(commandName)!.AutoComplete) {
				slashInteractions.get(commandName)!.AutoComplete!(i)
			}
		} else if (i.isModalSubmit()) {
			if (i.customId && modalInteractions.get(i.customId)) {
				modalInteractions.get(i.customId)?.Command({ client, interaction: i })
			}
		}
	})
}

register_interaction_handlers().catch((err) => {
	throw err
})

process.on('exit', async () => {
	client.destroy()
	await Database.close()
})

console.log('📂 Starting database...')
Database.authenticate()
	.then(async () => {
		await Database.query('PRAGMA journal_mode = WAL;') // Used for SQLite

		client.once('ready', () => {
			console.log('👍 Bot is active!')
		})

		console.log('🔃 Logging in...')
		client.login(process.env.BOT_TOKEN)
	})
	.catch((err) => {
		console.error('💥 An error has occured while trying to test database connection!')
		console.error(err)
	})
