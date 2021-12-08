import { IMessageHandler } from './globals'

export default function ({ client, message }: IMessageHandler) {
	if (message.author.id === client.user?.id) return
	if (message.author.bot) return

	if (message.content.startsWith('%echo ')) {
		message.channel.send(message.content.replace('%echo ', ''))
	}
}
