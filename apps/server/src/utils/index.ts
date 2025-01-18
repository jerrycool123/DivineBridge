import { ActionRows, GuildPayload, UserPayload } from '@divine-bridge/common';
import { TFunc } from '@divine-bridge/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  ButtonInteraction,
  ComponentType,
  Embed,
  Guild,
  InteractionEditReplyOptions,
  MessageFlags,
  RepliableInteraction,
  User,
} from 'discord.js';

dayjs.extend(utc);

export namespace Utils {
  export const sleep = async (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

  export const convertUser = (user: User): UserPayload => ({
    id: user.id,
    name: user.username,
    image: user.displayAvatarURL(),
  });

  export const convertGuild = (guild: Guild): GuildPayload => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL(),
  });

  export const awaitUserConfirm = async (
    t: TFunc,
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
      await originalInteraction.deferReply({ flags: [MessageFlags.Ephemeral] });
    }

    // Ask for confirmation
    const [confirmCustomId, cancelCustomId] = [
      `${uniqueIdentifier}-confirm-button`,
      `${uniqueIdentifier}-cancel-button`,
    ];
    const confirmActionRow = ActionRows.confirmButton(t, confirmCustomId, cancelCustomId);
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
    } catch (_error) {
      // Timeout
      await originalInteraction.editReply({
        content: t('server.Timed out Please try again'),
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
      content: t('server.Cancelled'),
      flags: [MessageFlags.Ephemeral],
    });
    return { confirmed: false, reason: 'cancelled' };
  };

  export const parseMembershipVerificationRequestEmbed = async (
    t: TFunc,
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
      const invalidActionRow = ActionRows.disabledInvalidButton(t);
      await interaction.message.edit({
        components: [invalidActionRow],
      });
      return { success: false, error } as const;
    };

    if (interaction.message.embeds.length === 0) {
      return await returnError(t('server.The message does not contain an embed'));
    }
    const embed = interaction.message.embeds[0];

    const userId = embed.footer?.text.split(`: `)[1] ?? null;
    if (userId === null) {
      return await returnError(
        `${t('server.The embed footer does not contain a valid user ID')} 🪪`,
      );
    }

    const beginDateString = embed.timestamp;
    const beginDate = beginDateString !== null ? dayjs.utc(beginDateString).startOf('date') : null;
    if (beginDate?.isValid() !== true) {
      return await returnError(t(`server.The embed timestamp does not contain a valid date`));
    }

    const endDateIndex = embed.fields.findIndex(({ name }) => name.startsWith('📅'));
    if (endDateIndex === -1) {
      return await returnError(t('server.The embed does not contain a valid recognized date'));
    }
    const endDateString = endDateIndex !== -1 ? embed.fields[endDateIndex].value : null;
    const rawEndDate =
      endDateString !== null ? dayjs.utc(endDateString, 'YYYY-MM-DD', true).startOf('date') : null;
    const endDate = (rawEndDate?.isValid() ?? false) ? rawEndDate : null;

    const roleRegex = /<@&(\d+)>/;
    const roleId =
      embed.fields.find(({ name }) => name.startsWith('⭐️'))?.value.match(roleRegex)?.[1] ?? null;
    if (roleId === null) {
      return await returnError(t('server.The embed does not contain a valid membership role ID'));
    }

    return { success: true, embed, userId, beginDate, endDate, endDateIndex, roleId };
  };
}
