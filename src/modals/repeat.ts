import { IModalHandler } from '../globals'

const ModalID: string = 'repeat'

const Handler: IModalHandler = {
	async Command({ client, interaction }) {
		await interaction.reply({ content: interaction.fields.getTextInputValue('repeatInput') })
	},
}

export { ModalID, Handler }
