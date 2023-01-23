import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from '@discordjs/builders'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path/posix'
dotenv.config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const expectedExtension = path.extname(__filename)
const timeout = (secs: number) =>
	new Promise<void>((res) => {
		setTimeout(res, secs * 1000)
	})

async function crawl_sub_command(
	commandPath: string,
	fullPath: string,
	builder: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
	once: boolean = false
) {
	for (const file of fs.readdirSync(commandPath + fullPath)) {
		if (path.basename(file, path.extname(file)) === '[index]') continue
		if (!path.extname(file)) {
			if (once) throw 'Invalid interaction!'
			if (!fs.existsSync(`${commandPath}${fullPath}/${file}/[index]${expectedExtension}`))
				throw 'Invalid interaction subcommand group!'
			const Builder: SlashCommandSubcommandGroupBuilder = (
				await import(`${commandPath}${fullPath}/${file}/[index]${expectedExtension}`)
			).default
			Builder.setName(path.basename(file))
			await crawl_sub_command(commandPath, `${fullPath}/${file}`, Builder, true)
			;(builder as SlashCommandBuilder).addSubcommandGroup(Builder)
		} else {
			const { Builder }: { Builder: SlashCommandSubcommandBuilder } = await import(
				`${commandPath}${fullPath}/${file}`
			)
			Builder.setName(path.basename(file, path.extname(file)))
			builder.addSubcommand(Builder)
		}
	}
}

;(async () => {
	let interactions: any[] = []
	for (const paths of ['commands/', 'menus/']) {
		const commandPath = path.join(__dirname, paths)
		if (!fs.existsSync(commandPath)) continue
		for (const file of fs.readdirSync(commandPath)) {
			try {
				if (!path.extname(file)) {
					if (paths === 'menus/') throw 'Cannot create subcommand for context menus'
					if (!fs.existsSync(`${commandPath}${file}/[index]${expectedExtension}`))
						throw 'Invalid interaction subcommand'
					const Builder = (await import(`${commandPath}${file}/[index]${expectedExtension}`)).default
					Builder.setName(file)
					await crawl_sub_command(commandPath, file, Builder)
					interactions.push(Builder)
				} else {
					const { Builder }: { Builder: SlashCommandBuilder } = await import(commandPath + file)
					Builder.setName(path.basename(file, path.extname(file)))
					interactions.push(Builder)
				}
			} catch (err) {
				console.error('Error while trying to load ' + file)
				console.error(err)
			}
		}
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
		console.log(interactions)
	}

	client.destroy()
})()
