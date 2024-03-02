import { ModalBuilder } from '@discordjs/builders';
import { TFunc } from '@divine-bridge/i18n';

import { ActionRows } from './action-rows.js';

export namespace Modals {
  export const reason = (t: TFunc, modalCustomId: string, inputCustomId: string): ModalBuilder => {
    const reasonActionRow = ActionRows.reasonInputModal(t, inputCustomId);
    return new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle(t('common.Provide a reason optional'))
      .addComponents(reasonActionRow);
  };

  export const dateModification = (
    t: TFunc,
    modalCustomId: string,
    inputCustomId: string,
  ): ModalBuilder => {
    const dateActionRow = ActionRows.dateInputModal(t, inputCustomId);
    return new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle(t('common.Modify Date'))
      .addComponents(dateActionRow);
  };
}
