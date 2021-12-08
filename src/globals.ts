import { SlashCommandBuilder } from '@discordjs/builders'
import { ButtonInteraction, CacheType, Client, CommandInteraction, Message, SelectMenuInteraction } from 'discord.js'

export interface ICommandHandlerParameters {
	client: Client
	interaction: CommandInteraction<CacheType>
}
export interface IButtonHandler {
	client: Client
	interaction: ButtonInteraction<CacheType>
}
export interface IMenuHandler {
	client: Client
	interaction: SelectMenuInteraction<CacheType>
}
export interface ICommandHandler {
	Command: (params: ICommandHandlerParameters) => void
}
export interface ICommand {
	Builder: SlashCommandBuilder
	Handler: ICommandHandler
}
export interface IMessageHandler {
	client: Client
	message: Message
}

type IWaterfallFunction<T> = (item: T, next: IWaterfallFunction<T>) => void
export interface IWaterfall<T> {
	Execute: IWaterfallFunction<T>
}
