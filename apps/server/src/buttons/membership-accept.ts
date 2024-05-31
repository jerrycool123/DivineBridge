import {
  ActionRows,
  AppEventLogService,
  Database,
  DiscordUtils,
  MembershipService,
} from '@divine-bridge/common';
import { t } from '@divine-bridge/i18n';
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

  public override async execute(
    interaction: ButtonInteraction,
    { guild, guildLocale, guild_t, author_t }: Button.ExecuteContext,
  ) {
    const { user: moderator } = interaction;

    await interaction.deferUpdate();

    // Parse embed
    if (interaction.message.embeds.length === 0) {
      return await interaction.followUp({
        content: author_t('server.Failed to parse the request embed'),
      });
    }
    const parsedResult = await Utils.parseMembershipVerificationRequestEmbed(author_t, interaction);
    if (!parsedResult.success) {
      return await interaction.followUp({
        content: parsedResult.error,
      });
    }
    const { embed, userId, beginDate, endDate, endDateIndex, roleId } = parsedResult;

    // Check if the guild has the membership role and the role is manageable, and upsert guild
    const [membershipRoleResult, manageableResult] = await Promise.all([
      Validators.isGuildHasMembershipRole(author_t, guild.id, roleId),
      Validators.isManageableRole(author_t, guild, roleId),
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
        content: author_t(
          'server.Failed to recognize the end date of the membership Please click the Modify button to set the correct date manually',
        ),
        ephemeral: true,
      });
    }
    const validDateResult = Validators.isValidDateInterval(author_t, endDate, beginDate);
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
        content: `${author_t('server.The user')} <@${userId}> ${author_t('server.is not a member of this server')}`,
      });
    }
    const {
      member: { user },
    } = memberResult;

    // Upsert user
    const userDoc = await Database.upsertUser(DiscordUtils.convertAPIUser(user));
    const userLocale = userDoc.preference.locale;

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(
      guild_t,
      logger,
      discordBotApi,
      guild.id,
    ).init();
    const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

    // Add membership to user
    const addMembershipResult = await membershipService.add({
      userLocale,
      guildLocale,
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
    const acceptedActionRow = ActionRows.disabledAcceptedButton(guild_t);
    await interaction.message.edit({
      content: notified ? '' : guild_t('common.event_log_not_notified'),
      embeds: [
        EmbedBuilder.from(embed)
          .setTitle(`✅ [${guild_t('common.Accepted')}] ` + (embed.title ?? ''))
          .setFields([
            ...embed.fields.slice(0, endDateIndex),
            {
              name: guild_t('common.Begin Date'),
              value: beginDate.format('YYYY-MM-DD'),
              inline: true,
            },
            {
              name: guild_t('common.End Date'),
              value: endDate.format('YYYY-MM-DD'),
              inline: true,
            },
            ...embed.fields.slice(endDateIndex + 1, embed.fields.length),
            {
              name: guild_t('common.Verified By'),
              value: `<@${moderator.id}>`,
              inline: true,
            },
          ])
          .setColor(Constants.colors.success),
      ],
      components: [acceptedActionRow],
    });

    await interaction.followUp({
      content: `${author_t('server.The membership verification request of')} <@${userId}> ${author_t('server.has been accepted')}`,
      ephemeral: true,
    });
  }
}
