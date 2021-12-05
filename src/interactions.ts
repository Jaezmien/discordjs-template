import { SlashCommandBuilder } from '@discordjs/builders'
import path from 'path/posix'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config()
;(async () => {
	// Load command builder
	const interactions: SlashCommandBuilder[] = []
	const commandPath = path.join(__dirname, 'commands/')
	const interactionFiles = fs.readdirSync(commandPath)
	for (const file of interactionFiles) {
		const { Builder } = await import(commandPath + '/' + file)
		interactions.push(Builder)
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN!)

	try {
		console.log('Started refreshing application (/) commands.')

		if (process.argv.includes('--global')) {
			await rest.put(
				Routes.applicationCommands(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					process.env.CLIENT_ID!
				),
				{ body: interactions }
			)
		} else {
			await rest.put(
				Routes.applicationGuildCommands(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					process.env.CLIENT_ID!,
					process.env.TEST_GUILD_ID!
				),
				{ body: interactions }
			)
		}

		console.log('Successfully reloaded application (/) commands.')
	} catch (error) {
		console.error(error)
	}
})()
