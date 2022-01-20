import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders'
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
	Interaction,
} from 'discord.js'
import { customAlphabet } from 'nanoid'
import fs from 'fs'
import path from 'path/posix'

export function get_avatar_url(i: Interaction) {
	if (i.member && i.member.user)
		return `https://cdn.discordapp.com/avatars/${i.member.user.id}/${i.member.user.avatar}.png`
	if (i.user) return `https://cdn.discordapp.com/avatars/${i.user.id}/${i.user.avatar}.png`
	throw 'Could not get avatar from "get_avatar_url"'
}
export function get_timestamp(i: Interaction, discord_epoch: boolean = true): Date {
	return new Date(+i.id / 4194304 + (discord_epoch ? 1420070400000 : 0))
}

/** 📝 Ends with a slash */
export const ROOT_PATH = path.normalize(path.resolve(__dirname, '../')) + '/'

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
export interface IMenuHandlerParameters extends IBaseCommandHandler {
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

type Awaitable<T> = T | PromiseLike<T>
export interface IPermission {
	id: string
	type: 'ROLE' | 'USER'
	permission: boolean
}
export interface ICommand {
	Builder: SlashCommandBuilder
	Handler: ICommandHandler
	Permissions?: IPermission[]
}
export interface ICommandHandler {
	Command: (params: ICommandHandlerParameters) => Awaitable<void>
}
export interface IMenu {
	Builder: ContextMenuCommandBuilder
	Handler: ICommandHandler
	Permissions?: IPermission[]
}
export interface IMenuHandler {
	Command: (params: IMenuHandlerParameters) => Awaitable<void>
}

export function initialize_folders() {
	const importantDirectories = ['errors/', 'database/']

	importantDirectories.forEach((dir) => {
		if (!fs.existsSync(path.join(ROOT_PATH, dir))) fs.mkdirSync(path.join(ROOT_PATH, dir))
	})
}
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12)
export function create_user_error(message: string): string {
	const uniqueID = nanoid()
	fs.writeFileSync(path.join(ROOT_PATH, 'errors/', uniqueID + '.txt'), message)
	return '🔥 An error has occured! Please report this to the bot moderator.\n\n**Error UID:** `' + uniqueID + '`'
}
