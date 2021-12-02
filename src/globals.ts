import { SlashCommandBuilder } from '@discordjs/builders'
import { CacheType, Client, CommandInteraction } from 'discord.js'

export interface ICommandHandlerParameters {
	client: Client
	interaction: CommandInteraction<CacheType>
}
export interface ICommandHandler {
	Command: (params: ICommandHandlerParameters) => void
}
export interface ICommand {
	Builder: SlashCommandBuilder
	Handler: ICommandHandler
}
