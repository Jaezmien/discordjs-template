import { SlashCommandSubcommandBuilder } from '@discordjs/builders'
import { ICommandHandler } from 'src/globals'

const Builder = new SlashCommandSubcommandBuilder().setDescription('Information about yourself')

const Handler: ICommandHandler = {
	Command({ client, interaction }) {
		interaction.reply({
			content: 'Your username is: ' + interaction.user.username,
		})
	},
}
export { Builder, Handler }
