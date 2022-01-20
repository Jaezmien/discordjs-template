import { SlashCommandSubcommandBuilder } from '@discordjs/builders'
import { ICommandHandler } from '../../globals'

const Builder = new SlashCommandSubcommandBuilder().setDescription('Information about the server')

const Handler: ICommandHandler = {
	Command({ client, interaction }) {
		interaction.reply({
			content: "The server's name is: " + interaction.guild?.name,
		})
	},
}

export { Builder, Handler }
