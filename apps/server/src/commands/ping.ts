import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';

export class PingCommand extends ChatInputCommand<false> {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('ping_command.name')
    .setI18nDescription('ping_command.description');
  public readonly devTeamOnly = false;
  public readonly guildOnly = false;
  public readonly moderatorOnly = false;

  public override async execute(interaction: ChatInputCommandInteraction) {
    const res = await interaction.reply({
      content: `Ping?`,
      flags: [MessageFlags.Ephemeral],
      withResponse: true,
    });

    const diff = res.interaction.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(this.context.client.ws.ping);
    return interaction.editReply(
      `Pong 🏓! (Round trip took: ${diff.toString()}ms. Heartbeat: ${ping.toString()}ms.)`,
    );
  }
}
