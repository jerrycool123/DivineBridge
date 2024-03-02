import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
} from '@discordjs/builders';
import { TFunc } from '@divine-bridge/i18n';
import { ButtonStyle, TextInputStyle } from 'discord-api-types/v10';

import { DiscordUtils } from '../utils/discord.js';

export namespace ActionRows {
  export const adminVerificationButton = (t: TFunc): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(DiscordUtils.membership.accept)
        .setStyle(ButtonStyle.Success)
        .setLabel(t('common.Accept')),
      new ButtonBuilder()
        .setCustomId(DiscordUtils.membership.reject)
        .setStyle(ButtonStyle.Danger)
        .setLabel(t('common.Reject')),
      new ButtonBuilder()
        .setCustomId(DiscordUtils.membership.modify)
        .setStyle(ButtonStyle.Primary)
        .setLabel(t('common.Modify')),
    );
  };

  export const disabledInvalidButton = (t: TFunc): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-invalid-button')
        .setStyle(ButtonStyle.Secondary)
        .setLabel(t('common.Invalid request'))
        .setDisabled(true),
    );
  };

  export const disabledAcceptedButton = (t: TFunc): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-accepted-button')
        .setStyle(ButtonStyle.Success)
        .setLabel(t('common.Accepted'))
        .setDisabled(true),
    );
  };

  export const disabledRejectedButton = (t: TFunc): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-rejected-button')
        .setStyle(ButtonStyle.Danger)
        .setLabel(t('common.Rejected'))
        .setDisabled(true),
    );
  };

  export const confirmButton = (
    t: TFunc,
    confirmCustomId: string,
    cancelCustomId: string,
  ): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmCustomId)
        .setLabel(t('common.Confirm'))
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(cancelCustomId)
        .setLabel(t('common.Cancel'))
        .setStyle(ButtonStyle.Secondary),
    );
  };

  export const reasonInputModal = (
    t: TFunc,
    inputCustomId: string,
  ): ActionRowBuilder<ModalActionRowComponentBuilder> => {
    return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(inputCustomId)
        .setLabel(t('common.Reason this will be sent to the user'))
        .setPlaceholder(t('common.Reason placeholder'))
        .setStyle(TextInputStyle.Short)
        .setRequired(false),
    );
  };

  export const dateInputModal = (
    t: TFunc,
    inputCustomId: string,
  ): ActionRowBuilder<ModalActionRowComponentBuilder> => {
    return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(inputCustomId)
        .setLabel(t('common.Correct Date must be YYYY-MM-DD'))
        .setPlaceholder('YYYY-MM-DD')
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
    );
  };
}
