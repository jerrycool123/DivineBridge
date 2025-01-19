import {
  ActionRowBuilder,
  ButtonBuilder,
  ModalActionRowComponentBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
} from '@discordjs/builders';
import { TFunc } from '@divine-bridge/i18n';
import { ButtonStyle, TextInputStyle } from 'discord-api-types/v10';

import { DiscordUtils } from '../utils/discord.js';

export namespace ActionRows {
  export const help = (t: TFunc): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(DiscordUtils.help.userTutorial)
        .setStyle(ButtonStyle.Success)
        .setLabel(t('common.User Tutorial')),
      new ButtonBuilder()
        .setCustomId(DiscordUtils.help.moderatorTutorial)
        .setStyle(ButtonStyle.Danger)
        .setLabel(t('common.Moderator Tutorial')),
      new ButtonBuilder()
        .setCustomId(DiscordUtils.help.commandList)
        .setStyle(ButtonStyle.Primary)
        .setLabel(t('common.Command List')),
    );
  };

  export const languageSelect = (
    t: TFunc,
    defaultLocale: string,
    supportedOCRLanguages: { language: string; code: string }[],
  ): ActionRowBuilder<StringSelectMenuBuilder> => {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('language-select')
        .setPlaceholder(t('common.Select a language'))
        .addOptions([
          ...supportedOCRLanguages.map(({ language, code }) => ({
            label: language,
            value: code,
            default: code === defaultLocale,
          })),
        ]),
    );
  };

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
    additionalButtons: ButtonBuilder[] = [],
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
      ...additionalButtons,
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
