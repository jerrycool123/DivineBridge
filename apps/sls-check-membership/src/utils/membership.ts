import { MembershipDoc, MembershipRoleDoc } from '@divine-bridge/common';

import { DiscordAPI } from './discord.js';

export const removeMembership = async (args: {
  guildId: string;
  membershipRoleDoc: MembershipRoleDoc;
  membershipDoc: MembershipDoc;
  removeReason: string;
}): Promise<boolean> => {
  const { guildId, membershipRoleDoc, membershipDoc, removeReason } = args;
  const { user: userId } = membershipDoc;
  const { _id: membershipRoleId } = membershipRoleDoc;

  let roleRemoved = false;
  const member = await DiscordAPI.fetchGuildMember(guildId, userId);
  if (member !== null) {
    roleRemoved = await DiscordAPI.removeGuildMemberRole(guildId, userId, membershipRoleId);
  }

  // Remove membership record in DB
  await membershipDoc.deleteOne();

  // DM user about the removal
  if (member !== null) {
    try {
      await DiscordAPI.createDMMessage(userId, {
        content: `Your membership role **@${membershipRoleDoc.profile.name}** has been removed, since ${removeReason}.`,
      });
    } catch (error) {
      // We cannot DM the user, so we just ignore it
      console.error(error);
    }
  }

  return roleRemoved;
};
