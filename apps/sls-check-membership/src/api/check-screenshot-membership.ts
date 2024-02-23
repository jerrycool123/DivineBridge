import {
  AppEventLogService,
  GuildCollection,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleCollection,
  MembershipService,
} from '@divine-bridge/common';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

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
  let removalCount = 0,
    removalFailCount = 0;

  // Get expired screenshot memberships from DB
  const currentDate = dayjs.utc().startOf('day');
  const membershipDocs = await MembershipCollection.find({
    $or: [{ type: 'manual' }, { type: 'screenshot' }],
    end: { $lte: currentDate.toISOString() },
  });

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
    const guildName = guildDoc.profile.name;

    // Initialize log service and membership service
    const appEventLogService = await new AppEventLogService(logger, discordBotApi, guildId).init();
    const membershipService = new MembershipService(discordBotApi, appEventLogService);

    // Check membership
    const failedRoleRemovalUserIds: string[] = [];
    for (const membershipDoc of membershipDocGroup) {
      const endDate = dayjs.utc(membershipDoc.end).startOf('day');
      const userId = membershipDoc.user;

      if (endDate.isSame(currentDate, 'date')) {
        // When the end date is today, we remind the user to renew their membership

        // Remind user to renew membership
        try {
          await discordBotApi.createDMMessage(userId, {
            content:
              `Your membership role **@${membershipRoleName}** will expire tomorrow.\n` +
              `Please use \`/${membershipRoleDoc.config.aliasCommandName}\` command to renew your membership in the server \`${guildName}\`.`,
          });
        } catch (error) {
          // We cannot DM the user, so we just ignore it
          logger.debug(
            `Failed to send DM to <@${userId}> for membership role <@&${membershipRoleId}>.`,
          );
        }
      } else if (endDate.isBefore(currentDate, 'date')) {
        // When the end date is before today, we remove the user's membership

        const removeMembershipResult = await membershipService.remove({
          guildId,
          membershipRoleDoc,
          membershipDoc,
          removeReason:
            `it has expired.\n` +
            `Please use \`/${membershipRoleDoc.config.aliasCommandName}\` command to renew your membership in the server \`${guildName}\``,
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
        content:
          `[Screenshot membership check]\n` +
          `Following are the users whose membership has expired, ` +
          `but the bot failed to remove their membership role <@&${membershipRoleId}>:\n` +
          failedRoleRemovalUserIds.map((userId) => `<@${userId}>`).join('\n') +
          `\n\nPlease manually remove the role from these users, and check if the bot has correct permissions.`,
      });
    }
  }

  logger.info(
    `Finished checking screenshot membership.\n` +
      `Removed ${removalCount} memberships (${removalFailCount} failed).`,
  );

  // ? Wait for 1 second to ensure the log is sent
  await sleep(1);
  return {
    statusCode: 200,
    body: JSON.stringify({ removalCount, removalFailCount }),
    headers: { 'Content-Type': 'application/json' },
  };
};
