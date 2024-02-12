import { MembershipRoleDoc, YouTubeChannelDoc } from '@divine-bridge/common';
import { container } from '@sapphire/framework';
import {
  ButtonInteraction,
  ComponentType,
  GuildMember,
  GuildTextBasedChannel,
  InteractionEditReplyOptions,
  MessageCreateOptions,
  RepliableInteraction,
} from 'discord.js';

import { ActionRows } from '../components/action-rows.js';

export namespace Utils {
  export const awaitUserConfirm = async (
    originalInteraction: RepliableInteraction,
    uniqueIdentifier: string,
    payload: InteractionEditReplyOptions,
    timeout = 60 * 1000,
  ): Promise<
    | {
        confirmed: true;
        interaction: ButtonInteraction;
      }
    | {
        confirmed: false;
        reason: 'cancelled' | 'timed-out';
      }
  > => {
    if (originalInteraction.replied === false && originalInteraction.deferred === false) {
      await originalInteraction.deferReply({ ephemeral: true });
    }

    // Ask for confirmation
    const [confirmCustomId, cancelCustomId] = [
      `${uniqueIdentifier}-confirm-button`,
      `${uniqueIdentifier}-cancel-button`,
    ];
    const confirmActionRow = ActionRows.confirmButton(confirmCustomId, cancelCustomId);
    const response = await originalInteraction.editReply({
      ...payload,
      components: [confirmActionRow],
    });

    // Disable confirm action row
    confirmActionRow.components.forEach((component) => component.setDisabled(true));

    // Wait for user's confirmation
    let buttonInteraction: ButtonInteraction;
    try {
      buttonInteraction = await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: (buttonInteraction) =>
          originalInteraction.user.id === buttonInteraction.user.id &&
          [confirmCustomId, cancelCustomId].includes(buttonInteraction.customId),
        time: timeout,
      });
    } catch (error) {
      // Timeout
      await originalInteraction.editReply({
        content: 'Timed out. Please try again.',
        components: [confirmActionRow],
      });
      return { confirmed: false, reason: 'timed-out' };
    }

    // When user clicked confirm button
    if (buttonInteraction.customId === confirmCustomId) {
      await originalInteraction.editReply({
        components: [confirmActionRow],
      });
      return { confirmed: true, interaction: buttonInteraction };
    }

    // When user clicked cancel button, or otherwise
    await originalInteraction.editReply({
      components: [confirmActionRow],
    });
    await buttonInteraction.reply({
      content: 'Cancelled.',
      ephemeral: true,
    });
    return { confirmed: false, reason: 'cancelled' };
  };

  export const sendEventLog = async ({
    guildOwner,
    logChannel,
    payload,
  }: {
    guildOwner?: GuildMember;
    logChannel?: GuildTextBasedChannel;
    payload: MessageCreateOptions;
  }): Promise<boolean> => {
    // Try to send event log to the log channel
    if (logChannel !== undefined) {
      try {
        await logChannel.send(payload);
        return true;
      } catch (error) {
        // We cannot send log to the log channel
        container.logger.error(error);
      }
    }

    // If the log is failed to send, try to DM the guild owner about the removal
    if (guildOwner !== undefined) {
      try {
        const content = payload.content !== undefined ? `\n\n${payload.content}` : '';
        await guildOwner.send({
          ...payload,
          content:
            `> I cannot send event log to the log channel in your server \`${guildOwner.guild.name}\`.\n` +
            `> Please make sure that the log channel is set with \`/set-log-channel\`, and that I have enough permissions to send messages in it.` +
            content,
        });
        return true;
      } catch (error) {
        // We cannot DM the owner
        container.logger.error(error);
      }
    }

    return false;
  };

  export const getRoleRemoveErrorPayload = (
    membershipRole:
      | string
      | (Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        }),
    userId: string,
  ): MessageCreateOptions => {
    // Parse membership role data
    let membershipRoleId: string, membershipRoleString: string;
    if (typeof membershipRole === 'string') {
      membershipRoleId = membershipRole;
      membershipRoleString = `<@&${membershipRoleId}> (ID: ${membershipRoleId})`;
    } else {
      membershipRoleId = membershipRole._id;
      membershipRoleString = `**@${membershipRole.profile.name}**`;
    }

    return {
      content:
        `I cannot remove the membership role ${membershipRoleString} from the user <@${userId}> due to one of the following reasons:\n` +
        '- The user has left the server\n' +
        '- The membership role has been removed from the server\n' +
        '- The bot does not have the permission to manage roles\n' +
        '- The bot is no longer in the server\n' +
        '- Other unknown bot error\n' +
        '\nIf you believe this is an unexpected error, please check if every settings is fine, or contact the bot owner to resolve this issue.',
    };
  };
}
