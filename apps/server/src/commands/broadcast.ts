import { GuildCollection } from '@divine-bridge/common';
import dedent from 'dedent';
import {
  ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { ChatInputCommand } from '../structures/chat-input-command.js';
import { Env } from '../utils/env.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

export class BroadcastCommand extends ChatInputCommand {
  public readonly command = new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('[Owner Only] Broadcast a message to all guilds.')
    .addStringOption((option) =>
      option.setName('message').setDescription('The message to broadcast.').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild);
  public readonly devTeamOnly = true;
  public readonly guildOnly = true;
  public readonly moderatorOnly = false;

  public override async execute(
    interaction: ChatInputCommandInteraction,
    { guild, author_t }: ChatInputCommand.ExecuteContext,
  ) {
    const { options, client } = interaction;

    // Double check if the command is executed in the development team guild
    if (guild.id !== Env.DEV_TEAM_DISCORD_GUILD_ID) {
      return await interaction.reply({
        content: 'This command is only available to the development team.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const message = options.getString('message', true);

    await interaction.reply({ content: 'Loading...', flags: [MessageFlags.Ephemeral] });
    await interaction.followUp({ content: message, flags: [MessageFlags.Ephemeral] });

    const guildDocs = await GuildCollection.find({ 'config.logChannel': { $ne: null } });
    const guildCount = guildDocs.length;

    // Ask for confirmation
    const confirmResult = await Utils.awaitUserConfirm(author_t, interaction, 'add-member', {
      content: dedent`
        Are you sure you want to broadcast this message to ${guildCount} guilds?
        Guilds without a log channel will be skipped.
        Here is the preview of the message:
      `,
    });
    if (!confirmResult.confirmed) return;
    const confirmedInteraction = confirmResult.interaction;
    await confirmedInteraction.deferReply({ flags: [MessageFlags.Ephemeral] });

    let successCount = 0;
    for (const guildDoc of guildDocs) {
      try {
        if (guildDoc.config.logChannel === null) {
          throw new Error(`Guild ${guildDoc._id} does not have a log channel.`);
        }
        const guild = await client.guilds.fetch(guildDoc._id);
        const logChannelResult = await Validators.isGuildHasLogChannel(author_t, guild);
        if (!logChannelResult.success) {
          throw new Error(logChannelResult.error);
        }
        await logChannelResult.data.send(message);
        successCount += 1;
      } catch (error) {
        console.error(error);
      }
      await Utils.sleep(1000);
    }
    await confirmedInteraction.editReply({
      content: `Broadcasted message to guilds, (Success: ${successCount.toString()}/${guildCount.toString()}).`,
    });
  }
}
