import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';

export class PingCommand extends ChatInputCommand<false> {
  public readonly command = new SlashCommandBuilder()
    .setI18nName('ping_command.name')
    .setI18nDescription('ping_command.description');
  public readonly devTeamOnly = false;
  public readonly guildOnly = false;
  public readonly moderatorOnly = false;

  public override async execute(interaction: ChatInputCommandInteraction) {
    const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });

    const diff = msg.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(this.context.client.ws.ping);
    return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
  }
}
