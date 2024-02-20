import { Database } from '@divine-bridge/common';
import { Events, Listener } from '@sapphire/framework';
import { Role } from 'discord.js';

export class RoleUpdateListener extends Listener<typeof Events.GuildRoleUpdate> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public async run(_oldRole: Role, newRole: Role) {
    await Database.updateMembershipRole({
      id: newRole.id,
      name: newRole.name,
      color: newRole.color,
    });
  }
}
