import {
  ActionRows,
  AppEventLogService,
  MembershipService,
  Modals,
  UserCollection,
} from '@divine-bridge/common';
import { t } from '@divine-bridge/i18n';
import {
  type ButtonInteraction,
  EmbedBuilder,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';

import { Constants } from '../constants.js';
import { Button } from '../structures/button.js';
import { discordBotApi } from '../utils/discord.js';
import { Utils } from '../utils/index.js';
import { logger } from '../utils/logger.js';
import { Validators } from '../utils/validators.js';

export class MembershipRejectButton extends Button {
  public readonly customId = Constants.membership.reject;
  public readonly sameClientOnly = true;
  public readonly guildOnly = true;

  public override async execute(
    interaction: ButtonInteraction,
    { guild, guildLocale, guild_t, author_t }: Button.ExecuteContext,
  ) {
    const { user: moderator } = interaction;

    // Create reject modal
    const modalCustomId = `${Constants.membership.reject}-modal-${interaction.id}`;
    const modalInputCustomId = `${Constants.membership.reject}-reason-input`;
    const reasonModal = Modals.reason(author_t, modalCustomId, modalInputCustomId);
    await interaction.showModal(reasonModal);

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
    const { embed, userId, roleId } = parsedResult;

    // Find user
    const userDoc = await UserCollection.findById(userId);
    const userLocale = userDoc?.preference.locale ?? guildLocale;

    // Check if the guild has the membership role
    const membershipRoleResult = await Validators.isGuildHasMembershipRole(
      author_t,
      guild.id,
      roleId,
    );
    if (!membershipRoleResult.success) {
      return await interaction.followUp({
        content: membershipRoleResult.error,
      });
    }
    const membershipRoleDoc = membershipRoleResult.data;

    // Get guild member
    const memberResult = await discordBotApi.fetchGuildMember(guild.id, userId);
    if (!memberResult.success) {
      return await interaction.followUp({
        content: `${author_t('server.The user')} <@${userId}> ${author_t('server.is not a member of this server')}`,
      });
    }

    // Receive rejection reason from the modal
    let modalSubmitInteraction: ModalSubmitInteraction;
    try {
      modalSubmitInteraction = await interaction.awaitModalSubmit({
        filter: (modalSubmitInteraction) =>
          moderator.id === modalSubmitInteraction.user.id &&
          modalSubmitInteraction.customId ===
            `${Constants.membership.reject}-modal-${interaction.id}`,
        time: 5 * 60 * 1000,
      });
      await modalSubmitInteraction.deferUpdate();
    } catch (_error) {
      // Timeout
      return;
    }
    const reason = modalSubmitInteraction.fields.getTextInputValue(modalInputCustomId);

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(
      guild_t,
      logger,
      discordBotApi,
      guild.id,
    ).init();
    const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

    // Reject membership to user
    const { notified } = await membershipService.reject({
      userLocale,
      guildName: guild.name,
      membershipRoleDoc,
      userId,
      reason,
    });

    // Mark the request as rejected
    const rejectedActionRow = ActionRows.disabledRejectedButton(guild_t);
    await interaction.message.edit({
      content: notified ? '' : guild_t('common.event_log_not_notified'),
      embeds: [
        EmbedBuilder.from(embed)
          .setTitle(`❌ [${guild_t('common.Rejected')}] ` + (embed.title ?? ''))
          .addFields([
            {
              name: guild_t('common.Rejected By'),
              value: `<@${moderator.id}>`,
              inline: true,
            },
            {
              name: guild_t('common.Reason'),
              value: reason.length > 0 ? reason : guild_t('common.None'),
            },
          ])
          .setColor(Constants.colors.error),
      ],
      components: [rejectedActionRow],
    });

    await interaction.followUp({
      content: `${author_t('server.The membership verification request of')} <@${userId}> ${author_t('server.has been rejected')}`,
      flags: [MessageFlags.Ephemeral],
    });
  }
}
