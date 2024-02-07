import {
  APIInteractionResponse,
  InteractionResponseType,
  MessageFlags,
} from 'discord-api-types/v10';

export const errorInteractionResponse: APIInteractionResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    flags: MessageFlags.Ephemeral,
    content: 'An error occurred while processing your request.',
  },
};
