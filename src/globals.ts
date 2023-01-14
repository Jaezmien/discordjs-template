import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders'
import {
	AutocompleteInteraction,
	ButtonInteraction,
	CacheType,
	ChatInputCommandInteraction,
	Client,
	Collection,
	ContextMenuCommandInteraction,
	Interaction,
	Message,
	MessageReaction,
	ModalSubmitInteraction,
	SelectMenuInteraction,
	Snowflake,
	User,
} from 'discord.js'
import fs from 'fs'
import { customAlphabet } from 'nanoid'
import path from 'path/posix'

export function get_avatar_url(i: Interaction) {
	if (i.member && i.member.user)
		return `https://cdn.discordapp.com/avatars/${i.member.user.id}/${i.member.user.avatar}.png`
	if (i.user) return `https://cdn.discordapp.com/avatars/${i.user.id}/${i.user.avatar}.png`
	throw 'Could not get avatar from "get_avatar_url"'
}
export function get_timestamp(i: string, discord_epoch: boolean = true): Date {
	return new Date(+i / 4194304 + (discord_epoch ? 1420070400000 : 0))
}

/** 📝 Ends with a slash */
export const ROOT_PATH = path.normalize(path.resolve(__dirname, '../')) + '/'

interface IBaseCommandHandler {
	client: Client
}
export interface ICommandHandlerParameters extends IBaseCommandHandler {
	interaction: ChatInputCommandInteraction<CacheType>
}
export interface IButtonHandler extends IBaseCommandHandler {
	interaction: ButtonInteraction<CacheType>
}
export interface ISelectionHandler extends IBaseCommandHandler {
	interaction: SelectMenuInteraction<CacheType>
}
export interface IMenuHandlerParameters extends IBaseCommandHandler {
	interaction: ContextMenuCommandInteraction<CacheType>
}
export interface IModalSubmitHandlerParameters extends IBaseCommandHandler {
	interaction: ModalSubmitInteraction<CacheType>
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

export type Awaitable<T> = T | PromiseLike<T>
export interface ICommand {
	Builder: SlashCommandBuilder
	Handler: ICommandHandler
}
export interface ICommandHandler {
	Command: (params: ICommandHandlerParameters) => Awaitable<void>
	AutoComplete?: (params: AutocompleteInteraction) => Awaitable<void>
}
export interface IMenu {
	Builder: ContextMenuCommandBuilder
	Handler: ICommandHandler
}
export interface IMenuHandler {
	Command: (params: IMenuHandlerParameters) => Awaitable<any>
}
export interface IModal {
	Builder: ContextMenuCommandBuilder
	Handler: ICommandHandler
}
export interface IModalHandler {
	Command: (params: IModalSubmitHandlerParameters) => Awaitable<any>
}

export function initialize_folders() {
	const importantDirectories = ['errors/', 'database/']

	importantDirectories.forEach((dir) => {
		if (!fs.existsSync(path.join(ROOT_PATH, dir))) fs.mkdirSync(path.join(ROOT_PATH, dir))
	})
}
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12)
export function create_user_error(error: any): string {
	const uniqueID = nanoid()

	let message = ''
	if (typeof error === 'string') {
		message = error
	} else if (error instanceof Error) {
		message = (error.name + '\n' + error.message + '\n' + error.stack).trim()
	} else {
		message = JSON.stringify(error, null, '\t')
	}

	fs.writeFileSync(path.join(ROOT_PATH, 'errors/', uniqueID + '.txt'), message)
	return '🔥 An error has occured! Please report this to the bot moderator.\n\n**Error UID:** `' + uniqueID + '`'
}
