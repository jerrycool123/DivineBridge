import {
  ActionRows,
  MembershipRoleDoc,
  UserPayload,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  ButtonInteraction,
  ComponentType,
  Embed,
  InteractionEditReplyOptions,
  MessageCreateOptions,
  RepliableInteraction,
  User,
} from 'discord.js';

dayjs.extend(utc);

export namespace Utils {
  export const convertUser = (user: User): UserPayload => ({
    id: user.id,
    name: user.username,
    image: user.displayAvatarURL(),
  });

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
    if (!originalInteraction.replied && !originalInteraction.deferred) {
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

  export const parseMembershipVerificationRequestEmbed = async (
    interaction: ButtonInteraction,
  ): Promise<
    | {
        success: true;
        embed: Embed;
        userId: string;
        beginDate: dayjs.Dayjs;
        endDate: dayjs.Dayjs | null;
        endDateIndex: number;
        roleId: string;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    const returnError = async (error: string) => {
      const invalidActionRow = ActionRows.disabledInvalidButton();
      await interaction.message.edit({
        components: [invalidActionRow],
      });
      return { success: false, error } as const;
    };

    if (interaction.message.embeds.length === 0) {
      return await returnError('The message does not contain an embed.');
    }
    const embed = interaction.message.embeds[0];

    const userId = embed.footer?.text.split('User ID: ')[1] ?? null;
    if (userId === null) {
      return await returnError(
        'The embed footer does not contain a user ID in the form of `User ID: {userId}`.',
      );
    }

    const beginDateString = embed.timestamp;
    const beginDate = beginDateString !== null ? dayjs.utc(beginDateString).startOf('date') : null;
    if (beginDate === null || !beginDate.isValid()) {
      return await returnError(`The embed timestamp does not contain a valid date.`);
    }

    const endDateIndex = embed.fields.findIndex(({ name }) => name === 'Recognized Date');
    if (endDateIndex === -1) {
      return await returnError('The embed does not contain a `Recognized Date` field.');
    }
    const endDateString = endDateIndex !== -1 ? embed.fields[endDateIndex].value : null;
    const rawEndDate =
      endDateString !== null ? dayjs.utc(endDateString, 'YYYY-MM-DD', true).startOf('date') : null;
    const endDate = rawEndDate?.isValid() ?? false ? rawEndDate : null;

    const roleRegex = /<@&(\d+)>/;
    const roleId =
      embed.fields.find(({ name }) => name === 'Membership Role')?.value?.match(roleRegex)?.[1] ??
      null;
    if (roleId === null) {
      return await returnError(
        'The embed does not contain a valid role ID in the `Membership Role` field.',
      );
    }

    return { success: true, embed, userId, beginDate, endDate, endDateIndex, roleId };
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
