import { Events, Listener } from '@sapphire/framework';
import { Role } from 'discord.js';

import { Database } from '../utils/database.js';

export class RoleUpdateListener extends Listener<typeof Events.GuildRoleUpdate> {
  public constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, options);
  }

  public async run(_oldRole: Role, newRole: Role) {
    console.log('RoleUpdateListener');
    await Database.updateMembershipRole({
      id: newRole.id,
      name: newRole.name,
      color: newRole.color,
    });
  }
}
