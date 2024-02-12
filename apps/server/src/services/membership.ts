import {
  MembershipCollection,
  MembershipDoc,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { container } from '@sapphire/framework';
import dayjs from 'dayjs';
import { Guild, GuildMember } from 'discord.js';

import { Database } from '../utils/database.js';
import { Fetchers } from '../utils/fetchers.js';
import { DiscordService } from './discord.js';

export namespace MembershipService {
  export const addMembership = async (args: {
    guild: Guild;
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    member: GuildMember;
    type: MembershipDoc['type'];
    begin: dayjs.Dayjs;
    end: dayjs.Dayjs;
  }): Promise<
    | {
        success: true;
        notified: boolean;
        updatedMembershipDoc: MembershipDoc;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    const { guild, membershipRoleDoc, member, type, begin, end } = args;

    // Add role to member
    try {
      await member.roles.add(membershipRoleDoc._id);
    } catch (error) {
      container.logger.error(error);
      return {
        success: false,
        error: 'Failed to add the role to the member.',
      };
    }

    // Create or update membership
    const updatedMembershipDoc = await Database.upsertMembership({
      userId: member.id,
      membershipRoleId: membershipRoleDoc._id,
      type,
      begin,
      end,
    });

    // DM the user
    let notified = false;
    try {
      await member.send({
        content: `You have been granted the membership role **@${membershipRoleDoc.profile.name}** in the server \`${guild.name}\`.`,
      });
      notified = true;
    } catch (error) {
      // User does not allow DMs
    }

    return { success: true, notified, updatedMembershipDoc };
  };

  export const rejectMembership = async (args: {
    guild: Guild;
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    member: GuildMember;
    reason: string;
  }): Promise<{ notified: boolean }> => {
    const { guild, membershipRoleDoc, member, reason } = args;

    // DM the user
    let notified = false;
    try {
      await member.send({
        content:
          `Your screenshot for the YouTube channel \`${membershipRoleDoc.youtube.profile.title}\` has been rejected in the server \`${guild.name}\`.` +
          (reason.length > 0 ? `\nReason: \`\`\`\n${reason}\n\`\`\`` : ''),
      });
      notified = true;
    } catch (error) {
      // User does not allow DMs
    }

    return { notified };
  };

  export const removeMembership = async (args: {
    guild: Guild;
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    membershipDoc: MembershipDoc;
    removeReason: string;
    continueOnError?: boolean;
  }): Promise<
    | {
        success: false;
        error: string;
      }
    | {
        success: true;
        notified: boolean;
        roleRemoved: boolean;
      }
  > => {
    const { guild, membershipDoc, membershipRoleDoc, removeReason, continueOnError = false } = args;
    const { user: userId } = membershipDoc;
    const { _id: membershipRoleId } = membershipRoleDoc;

    // Remove the role from the user
    let roleRemoved = false;
    const member = await Fetchers.fetchGuildMember(guild, membershipDoc.user);
    if (member !== null) {
      try {
        await member.roles.remove(membershipRoleId);
        roleRemoved = true;
      } catch (error) {
        container.logger.error(error);
        if (continueOnError === false) {
          return {
            success: false,
            error: 'Failed to remove the role from the member.',
          };
        } else {
          container.logger.error(
            `Failed to remove role <@&${membershipRoleId}> from user <@${userId}> in guild ${member.guild.id}.`,
          );
        }
      }
    }

    // Remove membership record in DB
    await membershipDoc.deleteOne();

    // DM user about the removal
    let notified = false;
    if (member !== null) {
      try {
        await member.send(
          `Your membership role **@${membershipRoleDoc.profile.name}** has been removed, since ${removeReason}.`,
        );

        notified = true;
      } catch (error) {
        // We cannot DM the user, so we just ignore it
        container.logger.error(error);
      }
    }

    return {
      success: true,
      notified,
      roleRemoved,
    };
  };

  export const purgeMembershipRole = async (args: {
    guild: Guild;
    membershipDocs: MembershipDoc[];
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    removeReason: string;
  }): Promise<void> => {
    // Remove the membership role and memberships from DB
    const { guild, membershipDocs, membershipRoleDoc, removeReason } = args;

    // Remove the membership role from DB
    await membershipRoleDoc.deleteOne();

    const membershipDocIds = membershipDocs.map(({ _id }) => _id.toString());
    await MembershipCollection.deleteMany({ _id: { $in: membershipDocIds } });

    // Remove the membership role from the users
    await Promise.all(
      membershipDocs.map((membershipDoc) =>
        DiscordService.apiQueue.add(async () =>
          removeMembership({
            guild,
            membershipDoc,
            membershipRoleDoc,
            removeReason,
            // Even when the role is not removed in Discord, we still remove the membership record in DB
            continueOnError: true,
          }),
        ),
      ),
    );
  };
}
