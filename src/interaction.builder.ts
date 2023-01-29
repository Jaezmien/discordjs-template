import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import path from 'path/posix'
import { CrawledPath, crawl_path } from './globals'
dotenv.config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const timeout = (secs: number) =>
	new Promise<void>((res) => {
		setTimeout(res, secs * 1000)
	})

async function main() {
	let interactions: any[] = []

	function verify_commands(commands: CrawledPath[]) {
		const p_lookup = new Map<string, number>()
		for (const p of commands) {
			if (p.depth == 0) continue

			const p_split = p.name.split(' ')
			const p_name = p_split.pop()!
			const p_key = p_split.join(' ')

			if (p_name !== '[index]' && !p_lookup.has(p_key)) throw `Invalid interaction subcommand (${p.name})`
			p_lookup.set(p_key, (p_lookup.get(p_key) ?? 0) + 1)

			if (p.depth > 2) throw `Invalid interaction subcommand group (${p.name})`
		}

		if (Array.from(p_lookup.keys()).some((k) => p_lookup.get(k) == 1)) {
			const k = Array.from(p_lookup.keys()).find((k) => p_lookup.get(k) == 1)
			throw `Interaction subcommand (${k}) is empty`
		}
	}

	const command_interactions = (await crawl_path(path.join(__dirname, 'commands/'))).sort((a, b) =>
		a.name.localeCompare(b.name)
	)
	verify_commands(command_interactions)
	for (let i = 0; i < command_interactions.length; i++) {
		let p = command_interactions[i]

		if (p.depth === 0) {
			const { Builder }: { Builder: SlashCommandBuilder } = await import(p.path)
			Builder.setName(path.basename(p.path, path.extname(p.path)))
			interactions.push(Builder)

			continue
		}

		const parentBuilder: SlashCommandBuilder = (await import(p.path)).default
		parentBuilder.setName(p.name.split(' ').slice(0, -1).join(' ').trim())

		const interaction_key = p.name.split(' ')[0]
		p = command_interactions[++i] // move to first command
		while (p && p.name.startsWith(`${interaction_key} `)) {
			if (p.name.split(' ').length == 2) {
				const { Builder: childBuilder }: { Builder: SlashCommandSubcommandBuilder } = await import(p.path)
				childBuilder.setName(p.name.split(' ').splice(-1).join(' ').trim())
				parentBuilder.addSubcommand(childBuilder)
			} else {
				const Builder: SlashCommandSubcommandGroupBuilder = (await import(p.path)).default
				Builder.setName(p.name.split(' ').splice(1, 1).join(' '))

				const child_key = p.name.split(' ').splice(0, 2).join(' ')
				p = command_interactions[++i] // move to first subcommand command
				while (p.name.startsWith(`${child_key} `)) {
					const { Builder: childBuilder }: { Builder: SlashCommandSubcommandBuilder } = await import(p.path)
					childBuilder.setName(p.name.split(' ').splice(-1).join(' ').trim())
					Builder.addSubcommand(childBuilder)

					p = command_interactions[++i]
				}
				i--

				parentBuilder.addSubcommandGroup(Builder)
			}

			p = command_interactions[++i]
		}
		i--

		interactions.push(parentBuilder)
	}

	const menu_interactions = (await crawl_path(path.join(__dirname, 'menus/'))).sort((a, b) =>
		a.name.localeCompare(b.name)
	)
	if (menu_interactions.some((p) => p.depth > 1)) {
		throw `Cannot create subcommand for context menus (${menu_interactions.find((p) => p.depth > 1)!.name})`
	}
	for (const p of menu_interactions) {
		const { Builder }: { Builder: SlashCommandBuilder } = await import(p.path)
		Builder.setName(path.basename(p.path, path.extname(p.path)))
		interactions.push(Builder)
	}

	const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN!)

	// Delete unused interactions
	{
		console.log('Logging in...')
		await client.login(process.env.BOT_TOKEN!)

		console.log('Fetching server commands...')
		const commands = process.argv.includes('--global')
			? client.application?.commands
			: (await client.guilds.fetch(process.env.TEST_GUILD_ID!))?.commands

		if (!commands) throw Error('Commands is undefined')

		await commands.fetch({})

		console.log('Removing unused interactions...')
		// Discord will override similar interaction names
		const unused = commands.cache.filter((val) => !interactions.find((i) => i.name === val.name))

		for (const key of Array.from(unused.keys())) {
			const cmd = unused.get(key)
			if (!cmd) {
				console.error(key + ' is undefined')
				return
			}

			console.log('Removing ' + cmd.name)

			try {
				if (process.argv.includes('--global')) {
					await rest.delete(Routes.applicationCommand(client.user!.id, cmd.id))
				} else {
					await rest.delete(
						Routes.applicationGuildCommand(client.user!.id, process.env.TEST_GUILD_ID!, cmd.id)
					)
				}
			} catch (error) {
				console.error(error)
				return
			}

			await timeout(2.5)
		}
	}

	console.log('Updating interactions...')
	interactions = interactions.map((i) => i.toJSON())
	try {
		if (process.argv.includes('--global')) {
			await rest.put(Routes.applicationCommands(client.user!.id), {
				body: interactions,
			})
		} else {
			await rest.put(Routes.applicationGuildCommands(client.user!.id, process.env.TEST_GUILD_ID!), {
				body: interactions,
			})
		}
	} catch (error) {
		console.error(error)
		console.log(JSON.stringify(interactions, null, ' '))
	}

	client.destroy()
}

main().catch(console.error)
