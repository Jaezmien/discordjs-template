import { SlashCommandBuilder } from '@discordjs/builders'
import { Client, GatewayIntentBits } from 'discord.js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path/posix'
import { IPermission } from './globals'
dotenv.config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const expectedExtension = path.extname(__filename)

;(async () => {
	let interactions = []
	console.log('Loading local commands...')
	for (const paths of ['commands/', 'menus/']) {
		const commandPath = path.join(__dirname, paths)
		if (!fs.existsSync(commandPath)) continue
		for (const file of fs.readdirSync(commandPath)) {
			try {
				if (!path.extname(file)) {
					if (!fs.existsSync(`${commandPath}${file}/[index]${expectedExtension}`))
						throw 'Invalid interaction subcommand'
					const { default: Builder, Permissions } = await import(
						`${commandPath}${file}/[index]${expectedExtension}`
					)
					interactions.push([Builder.setName(file), Permissions])
				} else {
					const { Builder, Permissions }: { Builder: SlashCommandBuilder; Permissions: IPermission } =
						await import(commandPath + file)
					interactions.push([Builder.setName(path.basename(file, path.extname(file))), Permissions])
				}
			} catch (err) {
				console.error('Error while trying to load ' + file)
				console.error(err)
			}
		}
	}

	console.log('Logging in...')
	await client.login(process.env.BOT_TOKEN!)

	console.log('Fetching server commands...')
	const commands = process.argv.includes('--global')
		? client.application?.commands
		: (await client.guilds.fetch(process.env.TEST_GUILD_ID!))?.commands

	if (!commands) throw Error('Commands is undefined')

	await commands.fetch({})

	const perms: any[] = []
	for (const interaction of interactions) {
		const cmd = commands.cache.find((i) => i.name === interaction[0].name)
		if (cmd && interaction[1] && Object.keys(interaction[1]).length) {
			perms.push({
				id: cmd.id,
				permissions: interaction[1],
			})
		}
	}

	console.log('Setting permissions...')
	/*await client.guilds.cache.get(process.env.TEST_GUILD_ID!)?.commands.permissions.set({
		fullPermissions: perms,
	})*/

	client.destroy()
})()
