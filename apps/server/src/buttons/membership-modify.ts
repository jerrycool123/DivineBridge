import { Modals } from '@divine-bridge/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  APIEmbedField,
  type ButtonInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';

import { Constants } from '../constants.js';
import { Button } from '../structures/button.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class MembershipModifyButton extends Button {
  public readonly customId = Constants.membership.modify;
  public readonly sameClientOnly = true;
  public readonly guildOnly = true;

  public override async execute(
    interaction: ButtonInteraction,
    { guild_t, author_t }: Button.ExecuteContext,
  ) {
    const { user: moderator } = interaction;

    // Display modal
    const modalCustomId = `${Constants.membership.modify}-modify-modal`;
    const modalInputCustomId = `${Constants.membership.modify}-date-input`;
    const modifyModal = Modals.dateModification(author_t, modalCustomId, modalInputCustomId);
    await interaction.showModal(modifyModal);

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
    const { embed, beginDate } = parsedResult;

    // Receive correct date from the modal
    let modalSubmitInteraction: ModalSubmitInteraction | null = null;
    try {
      modalSubmitInteraction = await interaction.awaitModalSubmit({
        filter: (modalSubmitInteraction) =>
          moderator.id === modalSubmitInteraction.user.id &&
          modalSubmitInteraction.customId === modalCustomId,
        time: 60 * 1000,
      });
      await modalSubmitInteraction.deferUpdate();
    } catch (error) {
      // Timeout
      return;
    }
    const endDateString = modalSubmitInteraction.fields.getTextInputValue(modalInputCustomId);

    // Parse modified date
    const newEndDate = dayjs.utc(endDateString, 'YYYY-MM-DD', true);
    if (!newEndDate.isValid()) {
      return await interaction.followUp({
        content: author_t(
          'server.Invalid date The date must be in YYYY-MM-DD format Please try again',
        ),
        ephemeral: true,
      });
    }

    // Check if the modified date is too far in the future
    const validDateResult = Validators.isValidDateInterval(author_t, newEndDate, beginDate);
    if (!validDateResult.success) {
      return await interaction.followUp({
        content: validDateResult.error,
        ephemeral: true,
      });
    }

    // Edit the recognized date field
    const fields = [...(embed.data.fields ?? [])];
    const recognizedDateFieldIndex = fields.findIndex(({ name }) => name.startsWith('📅')) ?? -1;
    const newRecognizedDateField: APIEmbedField = {
      name: `📅 ${guild_t('common.Recognized Date')}`,
      value: newEndDate.format('YYYY-MM-DD'),
      inline: true,
    };
    if (recognizedDateFieldIndex === -1) {
      fields.push(newRecognizedDateField);
    } else {
      fields[recognizedDateFieldIndex] = newRecognizedDateField;
    }

    // Edit the modified by field
    const modifiedByFieldIndex = fields.findIndex(({ name }) => name.startsWith('📝')) ?? -1;
    const newModifiedByField: APIEmbedField = {
      name: `📝 ${guild_t('common.Modified By')}`,
      value: `<@${moderator.id}>`,
      inline: true,
    };
    if (modifiedByFieldIndex === -1) {
      fields.push(newModifiedByField);
    } else {
      fields[modifiedByFieldIndex] = newModifiedByField;
    }

    // Modify the embed
    await interaction.message.edit({
      embeds: [EmbedBuilder.from(embed.data).setFields(fields).setColor('#FEE75C')],
    });

    await modalSubmitInteraction.followUp({
      content: `${author_t('server.The recognized date has been modified to')} \`${newEndDate.format('YYYY-MM-DD')}\`.`,
      ephemeral: true,
    });
  }
}
