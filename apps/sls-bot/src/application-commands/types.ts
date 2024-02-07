import { SlashCommandBuilder } from '@discordjs/builders';
import { APIInteractionResponse } from 'discord-api-types/v10';

export interface ApplicationCommand {
  data: SlashCommandBuilder;
  execute: () => Promise<APIInteractionResponse>;
}
