import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';

export class PingCommand extends ChatInputCommand<false> {
  public readonly command = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping bot to see the latency');
  public readonly global = true;
  public readonly guildOnly = false;

  public constructor(context: ChatInputCommand.Context) {
    super(context);
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const msg = await interaction.reply({ content: `Ping?`, ephemeral: true, fetchReply: true });

    const diff = msg.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(this.bot.client.ws.ping);
    return interaction.editReply(`Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`);
  }
}
