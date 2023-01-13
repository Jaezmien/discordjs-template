import { ContextMenuCommandBuilder } from '@discordjs/builders'
import { IMenuHandler } from '../globals'

const Builder = new ContextMenuCommandBuilder().setName('Poke').setType(2)

const Handler: IMenuHandler = {
	async Command({ client, interaction }) {
		await interaction.reply({
			content:
				interaction.options.getUser('user', true).username +
				' has been poked by ' +
				interaction.user.username +
				'!',
		})
	},
}

export { Builder, Handler }
