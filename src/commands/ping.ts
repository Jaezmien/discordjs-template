import { SlashCommandBuilder } from '@discordjs/builders'
import { get_timestamp, ICommandHandler } from '../globals'

const Builder = new SlashCommandBuilder().setDescription('Pings the bot')

const Handler: ICommandHandler = {
	Command({ client, interaction }) {
		interaction.reply({
			content: `🏓 ${Math.round(
				Math.abs(Date.now() - get_timestamp(interaction.id, true).getTime())
			)}ms\n🌐 ${Math.round(client.ws.ping)}ms`,
		})
	},
}

export { Builder, Handler }
