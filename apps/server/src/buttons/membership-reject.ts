import { ActionRows, AppEventLogService, MembershipService, Modals } from '@divine-bridge/common';
import { type ButtonInteraction, EmbedBuilder, ModalSubmitInteraction } from 'discord.js';

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

  public constructor(context: Button.Context) {
    super(context);
  }

  public async execute(interaction: ButtonInteraction, { guild }: Button.ExecuteContext) {
    const { user: moderator } = interaction;

    // Create reject modal
    const modalCustomId = `${Constants.membership.reject}-modal-${interaction.id}`;
    const modalInputCustomId = `${Constants.membership.reject}-reason-input`;
    const reasonModal = Modals.reason(modalCustomId, modalInputCustomId);
    await interaction.showModal(reasonModal);

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
    const { embed, userId, roleId } = parsedResult;

    // Check if the guild has the membership role
    const membershipRoleResult = await Validators.isGuildHasMembershipRole(guild.id, roleId);
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
        content: `The user <@${userId}> is not a member of this server.`,
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
    } catch (error) {
      // Timeout
      return;
    }
    const reason = modalSubmitInteraction.fields.getTextInputValue(modalInputCustomId);

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guild.id).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Reject membership to user
    const { notified } = await membershipService.reject({
      guildName: guild.name,
      membershipRoleDoc,
      userId,
      reason,
    });

    // Mark the request as rejected
    const rejectedActionRow = ActionRows.disabledRejectedButton();
    await interaction.message.edit({
      content: notified
        ? ''
        : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
      embeds: [
        EmbedBuilder.from(embed)
          .setTitle('❌ [Rejected] ' + (embed.title ?? ''))
          .addFields([
            {
              name: 'Rejected By',
              value: `<@${moderator.id}>`,
              inline: true,
            },
            {
              name: 'Reason',
              value: reason.length > 0 ? reason : 'None',
            },
          ])
          .setColor(Constants.colors.error),
      ],
      components: [rejectedActionRow],
    });

    await interaction.followUp({
      content: `The membership verification request of <@${userId}> has been rejected.`,
      ephemeral: true,
    });
  }
}
