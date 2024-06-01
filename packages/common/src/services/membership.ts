import { TLocaleFunc } from '@divine-bridge/i18n';
import dayjs from 'dayjs';
import dedent from 'dedent';

import { Embeds } from '../components/embeds.js';
import { UserDoc } from '../index.js';
import { MembershipRoleDoc } from '../models/membership-role.js';
import { MembershipCollection, MembershipDoc } from '../models/membership.js';
import { MembershipRoleDocWithValidYouTubeChannel, UserPayload } from '../types/common.js';
import { Database } from '../utils/database.js';
import { AppEventLogService } from './app-event-log.js';
import { DiscordBotAPI } from './discord-bot-api.js';

export class MembershipService {
  constructor(
    private readonly t: TLocaleFunc,
    private readonly discordBotApi: DiscordBotAPI,
    private readonly appEventLogService: AppEventLogService,
  ) {}

  public async add(
    args: {
      userLocale: string | undefined;
      guildLocale: string | undefined;
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
    const { userLocale, guildLocale } = args;
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
        error: this.t('common.Failed to add the role to the member', guildLocale),
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
      content: `${this.t('common.You have been granted the membership role', userLocale)} **@${membershipRoleName}** ${this.t('common.in the server', userLocale)} \`${guildName}\``,
    });

    // Send event log for specific membership types
    if (type === 'auth') {
      const embed = Embeds.authMembership(
        (key) => this.t(key, guildLocale),
        userPayload,
        membershipRoleId,
        updatedMembershipDoc,
      ).toJSON();
      await this.appEventLogService.log({ embeds: [embed] }, notified);
    } else if (type === 'manual') {
      const { moderatorId } = args;
      const embed = Embeds.manualMembershipAssignment(
        (key) => this.t(key, guildLocale),
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
    userLocale: string | undefined;
    guildName: string;
    membershipRoleDoc: MembershipRoleDocWithValidYouTubeChannel;
    userId: string;
    reason: string;
  }): Promise<{ notified: boolean }> {
    const { userLocale } = args;
    const { guildName, membershipRoleDoc, userId, reason } = args;
    const youtubeChannelTitle = membershipRoleDoc.youtube.profile.title;

    // DM the user
    const { success: notified } = await this.discordBotApi.createDMMessage(userId, {
      content:
        `${this.t('common.Your screenshot for the YouTube channel', userLocale)} \`${youtubeChannelTitle}\` ${this.t('common.has been rejected in the server', userLocale)} \`${guildName}\`` +
        (reason.length > 0
          ? dedent`
            
            ${this.t('common.Reason', userLocale)}:
            \`\`\`
            ${reason}
            \`\`\`
          `
          : ''),
    });

    return { notified };
  }

  public async remove(
    args: {
      userLocale: string | undefined;
      guildLocale: string | undefined;
      guildId: string;
      membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube' | 'guild'>;
      membershipDoc: Omit<MembershipDoc, 'membershipRole' | 'user'> & {
        user: string | UserDoc | null;
      };
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
    const { userLocale, guildLocale } = args;
    const { guildId, membershipRoleDoc, membershipDoc, removeReason, manual, purge = false } = args;
    const membershipRoleId = membershipRoleDoc._id;
    const membershipRoleName = membershipRoleDoc.profile.name;
    const userId =
      membershipDoc.user === null
        ? null
        : typeof membershipDoc.user === 'string'
          ? membershipDoc.user
          : membershipDoc.user._id;

    // Remove the role from the guild member
    let roleRemoved = false;
    if (userId !== null) {
      const { success } = await this.discordBotApi.removeGuildMemberRole(
        guildId,
        userId,
        membershipRoleId,
      );
      roleRemoved = success;
    }

    // Remove membership record in DB
    // ? If we are purging the role, the roles would be bulk-removed from the database
    if (!purge) {
      await membershipDoc.deleteOne();
    }

    // DM user about the removal
    let notified = false;
    if (userId !== null) {
      const { success } = await this.discordBotApi.createDMMessage(userId, {
        content: `${this.t('common.Your membership role', userLocale)} **@${membershipRoleName}** ${this.t('common.has been removed since', userLocale)}${removeReason}`,
      });
      notified = success;
    }

    // Send event log to the log channel when the role is removed manually
    if (manual) {
      const { userPayload, moderatorId } = args;
      const embed = Embeds.manualMembershipRemoval(
        (key) => this.t(key, guildLocale),
        userPayload,
        membershipRoleId,
        moderatorId,
      ).toJSON();
      await this.appEventLogService.log({ embeds: [embed] }, notified);
    }

    return { success: true, notified, roleRemoved };
  }

  public async purgeRole(args: {
    guildLocale: string | undefined;
    guildId: string;
    membershipRoleDoc: MembershipRoleDocWithValidYouTubeChannel;
    membershipDocs: (Omit<MembershipDoc, 'user'> & {
      user: UserDoc | null;
    })[];
    removeReason: string;
  }): Promise<void> {
    const { guildLocale } = args;
    const { guildId, membershipRoleDoc, membershipDocs, removeReason } = args;

    // Remove the membership role from DB
    await membershipRoleDoc.deleteOne();

    // Remove the memberships from DB
    const membershipDocIds = membershipDocs.map(({ _id }) => _id.toString());
    await MembershipCollection.deleteMany({ _id: { $in: membershipDocIds } });

    // Send event log to the log channel
    await this.appEventLogService.log({
      content: dedent`
        ${this.t('common.The membership role', guildLocale)} <@&${membershipRoleDoc._id}> ${this.t('common.has been removed since', guildLocale)}${removeReason}
        ${this.t(
          'common.I will try to remove the role from the members but if I failed to do so please remove the role manually If you believe this is an error please contact the bot owner to resolve this issue',
          guildLocale,
        )}
      `,
    });

    // Remove the membership role from the users
    await Promise.all(
      membershipDocs.map((membershipDoc) =>
        this.discordBotApi.apiQueue.add(async () =>
          this.remove({
            userLocale: guildLocale,
            guildLocale,
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
