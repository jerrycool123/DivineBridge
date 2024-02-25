import {
  ActionRows,
  AppEventLogService,
  DiscordUtils,
  MembershipService,
} from '@divine-bridge/common';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';

import { Constants } from '../constants.js';
import { Button } from '../structures/button.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

export class MembershipAcceptButton extends Button {
  public readonly customId = Constants.membership.accept;
  public readonly sameClientOnly = true;
  public readonly guildOnly = true;

  public constructor(context: Button.Context) {
    super(context);
  }

  public async execute(interaction: ButtonInteraction, { guild }: Button.ExecuteContext) {
    const { user: moderator } = interaction;

    await interaction.deferUpdate();

    // Parse embed
    if (interaction.message.embeds.length === 0) {
      return await interaction.followUp({
        content: 'Failed to parse the request embed.',
      });
    }
    const parsedResult = await Utils.parseMembershipVerificationRequestEmbed(interaction);
    if (!parsedResult.success) {
      return await interaction.followUp({
        content: parsedResult.error,
      });
    }
    const { embed, userId, beginDate, endDate, endDateIndex, roleId } = parsedResult;

    // Check if the guild has the membership role and the role is manageable
    const [membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(guild.id, roleId),
      Validators.isManageableRole(guild, roleId),
    ]);
    if (!membershipRoleResult.success) {
      return await interaction.followUp({
        content: membershipRoleResult.error,
      });
    } else if (!manageableResult.success) {
      return await interaction.followUp({
        content: manageableResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Check if the end date is too far in the future
    if (endDate === null) {
      return await interaction.followUp({
        content:
          'Failed to recognize the end date of the membership.\n' +
          'Please click the `Modify` button to set the correct date manually.',
        ephemeral: true,
      });
    }
    const validDateResult = Validators.isValidDateInterval(endDate, beginDate);
    if (!validDateResult.success) {
      return await interaction.followUp({
        content: validDateResult.error,
        ephemeral: true,
      });
    }

    // Get guild member
    const memberResult = await discordBotApi.fetchGuildMember(guild.id, userId);
    if (!memberResult.success) {
      return await interaction.editReply({
        content: `The user <@${userId}> is not a member of this server.`,
      });
    }
    const {
      member: { user },
    } = memberResult;

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guild.id).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Add membership to user
    const addMembershipResult = await membershipService.add({
      guildId: guild.id,
      guildName: guild.name,
      membershipRoleDoc,
      userPayload: DiscordUtils.convertAPIUser(user),
      type: 'screenshot',
      begin: beginDate,
      end: endDate,
    });
    if (!addMembershipResult.success) {
      return await interaction.followUp({
        content: addMembershipResult.error,
      });
    }
    const { notified } = addMembershipResult;

    // Mark the request as accepted
    const acceptedActionRow = ActionRows.disabledAcceptedButton();
    await interaction.message.edit({
      content: notified
        ? ''
        : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
      embeds: [
        EmbedBuilder.from(embed)
          .setTitle('✅ [Accepted] ' + (embed.title ?? ''))
          .setFields([
            ...embed.fields.slice(0, endDateIndex),
            {
              name: 'Begin Date',
              value: beginDate.format('YYYY-MM-DD'),
              inline: true,
            },
            {
              name: 'End Date',
              value: endDate.format('YYYY-MM-DD'),
              inline: true,
            },
            ...embed.fields.slice(endDateIndex + 1, embed.fields.length),
            {
              name: 'Verified By',
              value: `<@${moderator.id}>`,
              inline: true,
            },
          ])
          .setColor(Constants.colors.success),
      ],
      components: [acceptedActionRow],
    });

    await interaction.followUp({
      content: `The membership verification request of <@${userId}> has been accepted.`,
      ephemeral: true,
    });
  }
}
