import { IMessageEditHandler, IMessageHandler, IMessageReactHandler, IMessageReactRemoveBulkHandler } from './globals'

function onCreate({ client, message }: IMessageHandler) {
	if (message.author.id === client.user?.id) return
	if (message.author.bot) return

	if (message.content.startsWith('%echo ')) {
		message.channel.send(message.content.replace('%echo ', ''))
	}
}

function onEdit({ client, message, old_message }: IMessageEditHandler) {
	// ...
}

function onDestroy({ client, message }: IMessageHandler) {
	// ...
}

function onReactionCreate({ client, reaction, user }: IMessageReactHandler) {
	// ...
}
function onReactionRemove({ client, reaction, user }: IMessageReactHandler) {
	// ...
}
function onReactionRemoveBulk({ client, message, reactions }: IMessageReactRemoveBulkHandler) {
	// ...
}

export default { onCreate, onEdit, onDestroy, onReactionCreate, onReactionRemove, onReactionRemoveBulk }
