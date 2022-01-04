import { SlashCommandBuilder } from '@discordjs/builders'
import Collection from '@discordjs/collection'
import {
	ButtonInteraction,
	CacheType,
	Client,
	CommandInteraction,
	Message,
	MessageReaction,
	SelectMenuInteraction,
	ContextMenuInteraction,
	Snowflake,
	User,
} from 'discord.js'

interface IBaseCommandHandler {
	client: Client
}
export interface ICommandHandlerParameters extends IBaseCommandHandler {
	interaction: CommandInteraction<CacheType>
}
export interface IButtonHandler extends IBaseCommandHandler {
	interaction: ButtonInteraction<CacheType>
}
export interface ISelectionHandler extends IBaseCommandHandler {
	interaction: SelectMenuInteraction<CacheType>
}
export interface IMenuHandler extends IBaseCommandHandler {
	interaction: ContextMenuInteraction<CacheType>
}
export interface IMessageHandler extends IBaseCommandHandler {
	message: Message
}
export interface IMessageEditHandler extends IMessageHandler {
	old_message: Message
}
export interface IMessageReactHandler extends IBaseCommandHandler {
	reaction: MessageReaction
	user: User
}
export interface IMessageReactRemoveBulkHandler extends IBaseCommandHandler {
	message: Message
	reactions: Collection<string | Snowflake, MessageReaction>
}

export interface ICommandHandler {
	Command: (params: ICommandHandlerParameters) => void
}
export interface ICommand {
	Builder: SlashCommandBuilder
	Handler: ICommandHandler
}
