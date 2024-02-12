import {
  GuildCollection,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleCollection,
} from '@divine-bridge/common';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { checkAuth } from '../utils/auth.js';
import { DiscordAPI } from '../utils/discord.js';
import { Logger } from '../utils/logger.js';
import { removeMembership } from '../utils/membership.js';
import { dbConnect } from '../utils/mongoose.js';

dayjs.extend(utc);

export const checkScreenshotMembership = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  Logger.awsEventLog(event);
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  await Logger.sysLog(`Start checking screenshot membership.`, 'check-screenshot-membership');
  await dbConnect();
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

    console.log(`Checking membership role <@&${membershipRoleId}>...`);

    // Get membership role from DB
    const membershipRoleDoc = await MembershipRoleCollection.findById(membershipRoleId);
    if (membershipRoleDoc === null) {
      await Logger.sysLog(
        `Failed to find membership role <@&${membershipRoleId}> in the database.`,
        'check-screenshot-membership',
      );
      continue;
    }
    const membershipRoleName = membershipRoleDoc.profile.name;

    // Get guild from DB
    const guildId = membershipRoleDoc.guild;
    const guildDoc = await GuildCollection.findById(guildId);

    // Remove membership records if guild does not exist
    if (guildDoc === null) {
      await Logger.sysLog(
        `Failed to find the server ${guildId} which the role <@&${membershipRoleId}> belongs to in the database.`,
        'check-screenshot-membership',
      );
      continue;
    }
    const guildName = guildDoc.profile.name;

    // Check membership
    const failedRoleRemovalUserIds: string[] = [];
    for (const membershipDoc of membershipDocGroup) {
      const endDate = dayjs.utc(membershipDoc.end).startOf('day');
      const userId = membershipDoc.user;

      if (endDate.isSame(currentDate, 'date')) {
        // When the end date is today, we remind the user to renew their membership

        // Remind user to renew membership
        try {
          const user = await DiscordAPI.fetchUser(userId);
          if (user !== null) {
            await DiscordAPI.createDMMessage(userId, {
              content:
                `Your membership role **@${membershipRoleName}** will expire tomorrow.\n` +
                `Please use \`/verify\` command to renew your membership in the server \`${guildName}\`.`,
            });
          }
        } catch (error) {
          // We cannot DM the user, so we just ignore it
          console.error(error);
        }
      } else if (endDate.isBefore(currentDate, 'date')) {
        // When the end date is before today, we remove the user's membership

        const roleRemoved = await removeMembership({
          guildId,
          membershipRoleDoc,
          membershipDoc,
          removeReason:
            `it has expired.\n` +
            `Please use \`/verify\` command to renew your membership in the server \`${guildName}\``,
        });
        if (roleRemoved === false) {
          failedRoleRemovalUserIds.push(userId);
          removalFailCount += 1;
        }
        removalCount += 1;
      }
    }

    // Send log to the log channel if there are failed role removals
    if (failedRoleRemovalUserIds.length > 0) {
      await Logger.guildLog(guildDoc, {
        content:
          `[Screenshot membership check]\n` +
          `Following are the users whose membership has expired, ` +
          `but the bot failed to remove their membership role <@&${membershipRoleId}>:\n` +
          failedRoleRemovalUserIds.map((userId) => `<@${userId}>`).join('\n') +
          `\n\nPlease manually remove the role from these users, and check if the bot has correct permissions.`,
      });
    }
  }

  await Logger.sysLog(
    `Finished checking screenshot membership.\n` +
      `Removed ${removalCount} memberships (${removalFailCount} failed).`,
    'check-screenshot-membership',
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ removalCount, removalFailCount }),
    headers: { 'Content-Type': 'application/json' },
  };
};
