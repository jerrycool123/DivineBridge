import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import {
  APIEmbedField,
  type ButtonInteraction,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';

import { Embeds } from '../components/embeds.js';
import { Modals } from '../components/modals.js';
import { Constants } from '../constants.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class MembershipModifyButtonHandler extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    const { guild } = interaction;
    if (
      guild === null ||
      interaction.message.author.id !== this.container.client.id ||
      interaction.customId !== Constants.membership.modify
    ) {
      return this.none();
    }

    return this.some();
  }

  public async run(interaction: ButtonInteraction) {
    const { user: moderator } = interaction;

    const modalCustomId = `${Constants.membership.modify}-modify-modal`;
    const modalInputCustomId = `${Constants.membership.modify}-date-input`;
    const modifyModal = Modals.dateModification(modalCustomId, modalInputCustomId);
    await interaction.showModal(modifyModal);

    // Parse embed
    if (interaction.message.embeds.length === 0) {
      return await interaction.followUp({
        content: 'Failed to parse the request embed.',
      });
    }
    const parsedResult = await Embeds.parseMembershipVerificationRequestEmbed(interaction);
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
        content: 'Invalid date. The date must be in YYYY-MM-DD format. Please try again.',
        ephemeral: true,
      });
    }

    // Check if the modified date is too far in the future
    const validDateResult = Validators.isValidDateInterval(newEndDate, beginDate);
    if (!validDateResult.success) {
      return await interaction.followUp({
        content: validDateResult.error,
        ephemeral: true,
      });
    }

    // Edit the recognized date field
    const fields = [...(embed.data.fields ?? [])];
    const recognizedDateFieldIndex =
      fields.findIndex(({ name }) => name === 'Recognized Date') ?? -1;
    const newRecognizedDateField: APIEmbedField = {
      name: 'Recognized Date',
      value: newEndDate.format('YYYY-MM-DD'),
      inline: true,
    };
    if (recognizedDateFieldIndex === -1) {
      fields.push(newRecognizedDateField);
    } else {
      fields[recognizedDateFieldIndex] = newRecognizedDateField;
    }

    // Edit the modified by field
    const modifiedByFieldIndex = fields.findIndex(({ name }) => name === 'Modified By') ?? -1;
    const newModifiedByField: APIEmbedField = {
      name: 'Modified By',
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
  }
}
