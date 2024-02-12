import { Precondition } from '@sapphire/framework';
import { type CommandInteraction, PermissionFlagsBits } from 'discord.js';

import { Fetchers } from '../utils/fetchers.js';

declare module '@sapphire/framework' {
  interface Preconditions {
    RequireClientManageRole: never;
  }
}

export class RequireClientManageRolePrecondition extends Precondition {
  public override async chatInputRun(interaction: CommandInteraction) {
    const { guild } = interaction;
    if (guild === null) {
      return this.error({ message: 'This command can only be used in a server.' });
    }

    const botMember = await Fetchers.fetchBotGuildMember(guild);
    if (botMember === null) {
      return this.error({ message: 'The bot is not in the server.' });
    }

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return this.error({
        message: 'The bot requires `Manage Roles` permission to execute this command.',
      });
    }

    return this.ok();
  }
}
