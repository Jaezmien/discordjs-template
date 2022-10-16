import { ActionRowBuilder, SlashCommandBuilder, TextInputBuilder } from '@discordjs/builders'
import { ModalBuilder, TextInputStyle } from 'discord.js'
import { ICommandHandler } from '../globals'

const Builder = new SlashCommandBuilder().setDescription('Repeat a text!')

const Handler: ICommandHandler = {
	async Command({ client, interaction }) {
		const modal = new ModalBuilder().setCustomId('repeat').setTitle('Repeat Text')

		const repeatTextInput = new TextInputBuilder()
			.setCustomId('repeatInput')
			.setLabel('What is the text you want to repeat?')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)

		const firstRow = new ActionRowBuilder<TextInputBuilder>()
		firstRow.addComponents(repeatTextInput)

		modal.addComponents(firstRow)

		await interaction.showModal(modal)
	},
}

export { Builder, Handler }
