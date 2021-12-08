import {
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
	SlashCommandSubcommandGroupBuilder,
} from '@discordjs/builders'
import path from 'path/posix'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()

const commandPath = path.join(__dirname, 'commands/')
const expectedExtension = path.extname(__filename)

async function crawl_sub_command(
	fullPath: string,
	builder: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder,
	once: boolean = false
) {
	const baseFile = path.basename(fullPath, path.extname(fullPath))
	for (const file of fs.readdirSync(commandPath + fullPath)) {
		if (path.basename(file, path.extname(file)) === '[index]') continue
		if (!path.extname(file)) {
			if (once) throw 'Invalid interaction!'
			if (!fs.existsSync(`${commandPath}${fullPath}/${file}/[index]${expectedExtension}`))
				throw 'Invalid interaction subcommand group!'
			const Builder: SlashCommandSubcommandGroupBuilder = (
				await import(`${commandPath}${fullPath}/${file}/[index]${expectedExtension}`)
			).default
			Builder.setName(file)
			await crawl_sub_command(`${fullPath}/${file}`, Builder, true)
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
	let interactions = []
	for (const file of fs.readdirSync(commandPath)) {
		try {
			if (!path.extname(file)) {
				if (!fs.existsSync(`${commandPath}${file}/[index]${expectedExtension}`))
					throw 'Invalid interaction subcommand!'
				const Builder = (await import(`${commandPath}${file}/[index]${expectedExtension}`)).default
				Builder.setName(file)
				await crawl_sub_command(file, Builder)
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
	const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN!)
	interactions = interactions.map((i) => i.toJSON())
	try {
		if (process.argv.includes('--global')) {
			await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
				body: interactions,
			})
		} else {
			await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.TEST_GUILD_ID!), {
				body: interactions,
			})
		}
	} catch (error) {
		console.error(error)
	}
})()
