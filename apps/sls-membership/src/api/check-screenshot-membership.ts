import {
  AppEventLogService,
  GuildCollection,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleCollection,
  MembershipService,
  UserCollection,
  UserDoc,
} from '@divine-bridge/common';
import { TFunc, defaultLocale, initI18n, t } from '@divine-bridge/i18n';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dedent from 'dedent';

import { checkAuth } from '../utils/auth.js';
import { discordBotApi } from '../utils/discord.js';
import { checkScreenshotMembershipLogger as logger } from '../utils/logger.js';
import { dbConnect } from '../utils/mongoose.js';
import { sleep } from '../utils/sleep.js';

dayjs.extend(utc);

export const checkScreenshotMembership = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.debug(event);
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  logger.info(`Start checking screenshot membership.`);
  await dbConnect(logger);
  await initI18n();
  let removalCount = 0,
    removalFailCount = 0;

  // Get expired screenshot memberships from DB
  const currentDate = dayjs.utc().startOf('day');
  const lastDate = currentDate.subtract(1, 'day');
  const membershipDocs = await MembershipCollection.find({
    $or: [{ type: 'manual' }, { type: 'screenshot' }],
    end: { $lte: currentDate.toISOString() },
  });

  // Get users from DB
  const userDocs = await UserCollection.find({
    _id: { $in: membershipDocs.map((doc) => doc.user) },
  });
  const userDocRecord = userDocs.reduce<Record<string, UserDoc>>(
    (prev, userDoc) => ({ ...prev, [userDoc._id]: userDoc }),
    {},
  );

  // Group memberships by membership role
  const membershipDocRecord = membershipDocs.reduce<Record<string, MembershipDoc[]>>(
    (prev, membershipDoc) => {
      const { membershipRole: roleId } = membershipDoc;
      return { ...prev, [roleId]: [...(roleId in prev ? prev[roleId] : []), membershipDoc] };
    },
    {},
  );

  // Check memberships by group
  for (const [membershipRoleId, membershipDocGroup] of Object.entries(membershipDocRecord)) {
    if (membershipDocGroup.length === 0) continue;

    logger.debug(`Checking membership role <@&${membershipRoleId}>...`);

    // Get membership role from DB
    const membershipRoleDoc = await MembershipRoleCollection.findById(membershipRoleId);
    if (membershipRoleDoc === null) {
      logger.error(`Failed to find membership role <@&${membershipRoleId}> in the database.`);
      continue;
    }
    const membershipRoleName = membershipRoleDoc.profile.name;

    // Get guild from DB
    const guildId = membershipRoleDoc.guild;
    const guildDoc = await GuildCollection.findById(guildId);
    if (guildDoc === null) {
      logger.error(
        `Failed to find the server ${guildId} which the role <@&${membershipRoleId}> belongs to in the database.`,
      );
      continue;
    }
    const guildLocale = guildDoc.config.locale ?? defaultLocale;
    const guild_t: TFunc = (key) => t(key, guildLocale);
    const guildName = guildDoc.profile.name;

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(
      guild_t,
      logger,
      discordBotApi,
      guildId,
    ).init();
    const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

    // Check membership
    const failedRoleRemovalUserIds: string[] = [];
    for (const membershipDoc of membershipDocGroup) {
      const endDate = dayjs.utc(membershipDoc.end).startOf('day');
      const userId = membershipDoc.user;
      const userDoc = userId in userDocRecord ? userDocRecord[userId] : null;
      const userLocale = userDoc?.preference.locale;
      const user_t: TFunc = (key) => t(key, userLocale);

      if (endDate.isSame(currentDate, 'date')) {
        // When the end date is today, we remind the user to renew their membership

        // Remind user to renew membership
        try {
          await discordBotApi.createDMMessage(userId, {
            content: dedent`
              ${user_t('membership.check_screenshot_membership_reminder')} **@${membershipRoleName}** ${user_t('membership.check_screenshot_membership_reminder_2')}
              ${user_t('membership.check_screenshot_renew_instruction_1')} \`/${membershipRoleDoc.config.aliasCommandName}\` ${user_t('membership.check_screenshot_renew_instruction_2')} \`${guildName}\`
            `,
          });
        } catch (error) {
          // We cannot DM the user, so we just ignore it
          logger.debug(
            `Failed to send DM to <@${userId}> for membership role <@&${membershipRoleId}>.`,
          );
        }
      } else if (endDate.isBefore(lastDate, 'date')) {
        // When the end date is before yesterday, we remove the user's membership
        // e.g. The billing date is at 5th, and today is 7th, we remove the membership

        const removeMembershipResult = await membershipService.remove({
          userLocale,
          guildLocale,
          guildId,
          membershipRoleDoc,
          membershipDoc,
          removeReason: dedent`
            ${user_t('membership.check_screenshot_membership_failed_1')}
            ${user_t('membership.check_screenshot_renew_instruction_1')} \`/${membershipRoleDoc.config.aliasCommandName}\` ${user_t('membership.check_screenshot_renew_instruction_2')} \`${guildName}\`
          `,
          manual: false,
        });
        if (!removeMembershipResult.success || !removeMembershipResult.roleRemoved) {
          failedRoleRemovalUserIds.push(userId);
          removalFailCount += 1;
        }
        removalCount += 1;
      }
    }

    // Send log to the log channel if there are failed role removals
    if (failedRoleRemovalUserIds.length > 0) {
      await appEventLogService.log({
        content: dedent`
          ${guild_t('membership.check_screenshot_membership')}
          ${guild_t('membership.check_membership_failed_removal_guild_log_1')} <@&${membershipRoleId}>:
          ${failedRoleRemovalUserIds.map((userId) => `<@${userId}>`).join('\n')}
          
          ${guild_t('membership.check_membership_failed_removal_guild_log_2')}
        `,
      });
    }
  }

  logger.info(
    dedent`
      Finished checking screenshot membership.
      Removed ${removalCount} memberships (${removalFailCount} failed).
    `,
  );

  // ? Wait for 1 second to ensure the log is sent
  await sleep(1);
  return {
    statusCode: 200,
    body: JSON.stringify({ removalCount, removalFailCount }),
    headers: { 'Content-Type': 'application/json' },
  };
};
