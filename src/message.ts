import {
	Awaitable,
	IMessageEditHandler,
	IMessageHandler,
	IMessageReactHandler,
	IMessageReactRemoveBulkHandler,
} from './globals'

function onCreate({ client, message }: IMessageHandler): Awaitable<void> {
	if (message.author.id === client.user?.id) return
	if (message.author.bot) return

	if (message.content.startsWith('%echo ')) {
		message.channel.send(message.content.replace('%echo ', ''))
	}
}

function onEdit({ client, message, old_message }: IMessageEditHandler): Awaitable<void> {
	// ...
}

function onDestroy({ client, message }: IMessageHandler): Awaitable<void> {
	// ...
}

function onReactionCreate({ client, reaction, user }: IMessageReactHandler): Awaitable<void> {
	// ...
}
function onReactionRemove({ client, reaction, user }: IMessageReactHandler): Awaitable<void> {
	// ...
}
function onReactionRemoveBulk({ client, message, reactions }: IMessageReactRemoveBulkHandler): Awaitable<void> {
	// ...
}

export default { onCreate, onEdit, onDestroy, onReactionCreate, onReactionRemove, onReactionRemoveBulk }
