import { SlashCommandSubcommandBuilder } from '@discordjs/builders'
import { GuildChannel } from 'discord.js'
import { ICommandHandler } from '../../globals'

const Builder = new SlashCommandSubcommandBuilder().setDescription('Information about a channel')
Builder.addChannelOption((option) =>
	option.setName('channel').setDescription('The channel to fetch info').addChannelType(0)
)

const Handler: ICommandHandler = {
	async Command({ client, interaction }) {
		const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as GuildChannel
		if (!channel) {
			interaction.reply({
				content: 'Could not find channel!',
			})
		} else {
			interaction.reply({
				content: "The channel's name is " + channel.name,
			})
		}
	},
}

export { Builder, Handler }
