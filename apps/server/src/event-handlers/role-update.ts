import { Database } from '@divine-bridge/common';
import { Events, Role } from 'discord.js';

import { EventHandler } from '../structures/event-handler.js';

export class RoleUpdateEventHandler extends EventHandler<Events.GuildRoleUpdate> {
  public readonly event = Events.GuildRoleUpdate;
  public readonly once = false;

  public constructor(context: EventHandler.Context) {
    super(context);
  }

  public async execute(_oldRole: Role, newRole: Role) {
    await Database.updateMembershipRole({
      id: newRole.id,
      name: newRole.name,
      color: newRole.color,
    });
  }
}
