import { SlashCommandSubcommandBuilder } from '@discordjs/builders'
import { ChannelType, GuildChannel } from 'discord.js'
import { ICommandHandler } from '../../globals'

const Builder = new SlashCommandSubcommandBuilder().setDescription('Information about a channel')
Builder.addChannelOption((option) =>
	option.setName('channel').setDescription('The channel to fetch info').addChannelTypes(ChannelType.GuildText)
)

const Handler: ICommandHandler = {
	async Command({ client, interaction }) {
		const channel = (interaction.options.get('channel', false) ?? interaction.channel) as GuildChannel
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
