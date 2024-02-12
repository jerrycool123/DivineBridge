import {
  type ChatInputCommandDeniedPayload,
  Events,
  Listener,
  type UserError,
} from '@sapphire/framework';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public run(error: UserError, { interaction }: ChatInputCommandDeniedPayload) {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        content: error.message,
      });
    }

    return interaction.reply({
      content: error.message,
      ephemeral: true,
    });
  }
}
