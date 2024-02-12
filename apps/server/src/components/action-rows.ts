import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

import { Constants } from '../constants.js';

export namespace ActionRows {
  export const adminVerificationButton = (): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(Constants.membership.accept)
        .setStyle(ButtonStyle.Success)
        .setLabel('Accept'),
      new ButtonBuilder()
        .setCustomId(Constants.membership.reject)
        .setStyle(ButtonStyle.Danger)
        .setLabel('Reject'),
      new ButtonBuilder()
        .setCustomId(Constants.membership.modify)
        .setStyle(ButtonStyle.Primary)
        .setLabel('Modify'),
    );
  };

  export const disabledInvalidButton = (): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-invalid-button')
        .setStyle(ButtonStyle.Secondary)
        .setLabel('Invalid request')
        .setDisabled(true),
    );
  };

  export const disabledAcceptedButton = (): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-accepted-button')
        .setStyle(ButtonStyle.Success)
        .setLabel('Accepted')
        .setDisabled(true),
    );
  };

  export const disabledRejectedButton = (): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('anonymous-disabled-rejected-button')
        .setStyle(ButtonStyle.Danger)
        .setLabel('Rejected')
        .setDisabled(true),
    );
  };

  export const confirmButton = (
    confirmCustomId: string,
    cancelCustomId: string,
  ): ActionRowBuilder<ButtonBuilder> => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(confirmCustomId)
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(cancelCustomId)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary),
    );
  };

  export const reasonInputModal = (
    inputCustomId: string,
  ): ActionRowBuilder<ModalActionRowComponentBuilder> => {
    return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(inputCustomId)
        .setLabel('Reason (this will be sent to the user)')
        .setPlaceholder('Reason...')
        .setStyle(TextInputStyle.Short)
        .setRequired(false),
    );
  };

  export const dateInputModal = (
    inputCustomId: string,
  ): ActionRowBuilder<ModalActionRowComponentBuilder> => {
    return new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      new TextInputBuilder()
        .setCustomId(inputCustomId)
        .setLabel('Correct Date (must be YYYY-MM-DD)')
        .setPlaceholder('YYYY-MM-DD')
        .setStyle(TextInputStyle.Short)
        .setRequired(true),
    );
  };
}
