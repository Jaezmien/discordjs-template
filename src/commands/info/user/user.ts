import { SlashCommandSubcommandBuilder } from '@discordjs/builders'
import { GuildMember } from 'discord.js'
import { ICommandHandler } from 'src/globals'

const Builder = new SlashCommandSubcommandBuilder()
	.setDescription('Information about someone else')
	.addUserOption((user) => user.setName('user').setDescription('The user to get information from').setRequired(true))

const Handler: ICommandHandler = {
	Command({ client, interaction }) {
		const user = interaction.options.getMember('user', true) as GuildMember
		interaction.reply({
			content: 'The username of the user is: ' + user.user.username,
		})
	},
}

export { Builder, Handler }
