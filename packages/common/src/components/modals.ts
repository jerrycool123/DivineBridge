import { ModalBuilder } from '@discordjs/builders';

import { ActionRows } from './action-rows.js';

export namespace Modals {
  export const reason = (modalCustomId: string, inputCustomId: string): ModalBuilder => {
    const reasonActionRow = ActionRows.reasonInputModal(inputCustomId);
    return new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle('Provide a reason (optional)')
      .addComponents(reasonActionRow);
  };

  export const dateModification = (modalCustomId: string, inputCustomId: string): ModalBuilder => {
    const dateActionRow = ActionRows.dateInputModal(inputCustomId);
    return new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle('Modify Date')
      .addComponents(dateActionRow);
  };
}
