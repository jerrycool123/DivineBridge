import { MembershipRoleCollection } from '@divine-bridge/common';
import { Events, Listener } from '@sapphire/framework';
import { Interaction } from 'discord.js';

import { VerifyCommand } from '../commands/verify.js';

export class InteractionCreateListener extends Listener<typeof Events.InteractionCreate> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public async run(interaction: Interaction) {
    // Check if the command is an alias of the verify command
    if (!interaction.isChatInputCommand()) return;
    const { guild, commandId } = interaction;
    if (guild === null) return;
    const membershipRoleDoc = await MembershipRoleCollection.findOne({
      'guild': guild.id,
      'config.aliasCommandId': commandId,
    });
    if (membershipRoleDoc === null) return;

    // Find verify command and dispatch
    const verifyCommand = this.container.stores.get('commands').get('verify') as
      | VerifyCommand
      | undefined;
    if (verifyCommand === undefined) {
      this.container.logger.error('Verify command not found');
      return;
    }
    await verifyCommand.chatInputRunAlias(interaction, { membershipRoleId: membershipRoleDoc._id });
  }
}
