import dayjs from 'dayjs';

import { Embeds } from '../components/embeds.js';
import { MembershipRoleDoc } from '../models/membership-role.js';
import { MembershipCollection, MembershipDoc } from '../models/membership.js';
import { YouTubeChannelDoc } from '../models/youtube-channel.js';
import { UserPayload } from '../types/common.js';
import { Database } from '../utils/database.js';
import { AppEventLogService } from './app-event-log.js';
import { DiscordBotAPI } from './discord-bot-api.js';

export class MembershipService {
  constructor(
    private readonly discordBotApi: DiscordBotAPI,
    private readonly appEventLogService: AppEventLogService,
  ) {}

  public async add(
    args: {
      guildId: string;
      guildName: string;
      membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube' | 'guild'>;
      userPayload: UserPayload;
      begin: dayjs.Dayjs;
      end: dayjs.Dayjs;
    } & (
      | {
          type: Exclude<MembershipDoc['type'], 'manual'>;
        }
      | {
          type: 'manual';
          moderatorId: string;
        }
    ),
  ): Promise<
    | {
        success: true;
        notified: boolean;
        updatedMembershipDoc: MembershipDoc;
      }
    | {
        success: false;
        error: string;
      }
  > {
    const { guildId, guildName, membershipRoleDoc, userPayload, type, begin, end } = args;
    const membershipRoleId = membershipRoleDoc._id;
    const membershipRoleName = membershipRoleDoc.profile.name;
    const userId = userPayload.id;

    // Add role to member
    const addResult = await this.discordBotApi.addGuildMemberRole(
      guildId,
      userId,
      membershipRoleId,
    );
    if (!addResult.success) {
      return {
        success: false,
        error: 'Failed to add the role to the member.',
      };
    }

    // Create or update membership
    const updatedMembershipDoc = await Database.upsertMembership({
      userId,
      membershipRoleId,
      type,
      begin,
      end,
    });

    // DM the user
    const { success: notified } = await this.discordBotApi.createDMMessage(userId, {
      content: `You have been granted the membership role **@${membershipRoleName}** in the server \`${guildName}\`.`,
    });

    // Send event log for specific membership types
    if (type === 'auth') {
      const embed = Embeds.authMembership(
        userPayload,
        membershipRoleId,
        updatedMembershipDoc,
      ).toJSON();
      await this.appEventLogService.log({ embeds: [embed] }, notified);
    } else if (type === 'manual') {
      const { moderatorId } = args;
      const embed = Embeds.manualMembershipAssignment(
        userPayload,
        updatedMembershipDoc.begin,
        updatedMembershipDoc.end,
        updatedMembershipDoc.membershipRole,
        moderatorId,
      ).toJSON();
      await this.appEventLogService.log({ embeds: [embed] }, notified);
    }

    return { success: true, notified, updatedMembershipDoc };
  }

  public async reject(args: {
    guildName: string;
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    userId: string;
    reason: string;
  }): Promise<{ notified: boolean }> {
    const { guildName, membershipRoleDoc, userId, reason } = args;
    const youtubeChannelTitle = membershipRoleDoc.youtube.profile.title;

    // DM the user
    const { success: notified } = await this.discordBotApi.createDMMessage(userId, {
      content:
        `Your screenshot for the YouTube channel \`${youtubeChannelTitle}\` has been rejected in the server \`${guildName}\`.` +
        (reason.length > 0 ? `\nReason: \`\`\`\n${reason}\n\`\`\`` : ''),
    });

    return { notified };
  }

  public async remove(
    args: {
      guildId: string;
      membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'>;
      membershipDoc: Omit<MembershipDoc, 'membershipRole'>;
      removeReason: string;
      purge?: boolean;
    } & (
      | {
          manual: false;
        }
      | {
          manual: true;
          userPayload: UserPayload;
          moderatorId: string;
        }
    ),
  ): Promise<
    | {
        success: false;
        error: string;
      }
    | {
        success: true;
        notified: boolean;
        roleRemoved: boolean;
      }
  > {
    const { guildId, membershipRoleDoc, membershipDoc, removeReason, manual, purge = false } = args;
    const membershipRoleId = membershipRoleDoc._id;
    const membershipRoleName = membershipRoleDoc.profile.name;
    const userId = membershipDoc.user;

    // Remove the role from the guild member
    const { success: roleRemoved } = await this.discordBotApi.removeGuildMemberRole(
      guildId,
      userId,
      membershipRoleId,
    );

    // If the role is not removed, we stop when it's a manual removal
    if (!roleRemoved && manual) {
      return {
        success: false,
        error: 'Failed to remove the role from the member.',
      };
    }

    // Remove membership record in DB
    // ? If we are purging the role, the roles would be bulk-removed from the database
    if (!purge) {
      await membershipDoc.deleteOne();
    }

    // DM user about the removal
    const { success: notified } = await this.discordBotApi.createDMMessage(userId, {
      content: `Your membership role **@${membershipRoleName}** has been removed, since ${removeReason}.`,
    });

    // Send event log to the log channel when the role is removed manually
    if (manual) {
      const { userPayload, moderatorId } = args;
      const embed = Embeds.manualMembershipRemoval(
        userPayload,
        membershipRoleId,
        moderatorId,
      ).toJSON();
      await this.appEventLogService.log({ embeds: [embed] }, notified);
    }

    return { success: true, notified, roleRemoved };
  }

  public async purgeRole(args: {
    guildId: string;
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    };
    membershipDocs: MembershipDoc[];
    removeReason: string;
  }): Promise<void> {
    // Remove the membership role and memberships from DB
    const { guildId, membershipRoleDoc, membershipDocs, removeReason } = args;

    // Remove the membership role from DB
    await membershipRoleDoc.deleteOne();

    // Remove the memberships from DB
    const membershipDocIds = membershipDocs.map(({ _id }) => _id.toString());
    await MembershipCollection.deleteMany({ _id: { $in: membershipDocIds } });

    // Send event log to the log channel
    await this.appEventLogService.log({
      content:
        `The membership role <@&${membershipRoleDoc._id}> has been removed, since ${removeReason}.\n` +
        'I will try to remove the role from the members, but if I failed to do so, please remove the role manually.\n' +
        'If you believe this is an error, please contact the bot owner to resolve this issue.',
    });

    // Remove the membership role from the users
    await Promise.all(
      membershipDocs.map((membershipDoc) =>
        this.discordBotApi.apiQueue.add(async () =>
          this.remove({
            guildId,
            membershipRoleDoc,
            membershipDoc,
            removeReason,
            manual: false,
            purge: true,
          }),
        ),
      ),
    );
  }
}
