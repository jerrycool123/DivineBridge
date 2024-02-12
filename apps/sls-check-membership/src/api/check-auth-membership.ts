import {
  GoogleAPI,
  GuildCollection,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleCollection,
  UserCollection,
  UserDoc,
  YouTubeChannelCollection,
  symmetricDecrypt,
} from '@divine-bridge/common';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { checkAuth } from '../utils/auth.js';
import { Env } from '../utils/env.js';
import { Logger } from '../utils/logger.js';
import { removeMembership } from '../utils/membership.js';
import { dbConnect } from '../utils/mongoose.js';

dayjs.extend(utc);

export const checkAuthMembership = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  Logger.awsEventLog(event);
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  await Logger.sysLog(`Start checking auth membership.`, 'check-auth-membership');
  await dbConnect();
  let removalCount = 0;

  // Get auth memberships from DB
  const membershipDocs = await MembershipCollection.find({
    type: 'auth',
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
      const roleId = membershipDoc.membershipRole;
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
        'check-auth-membership',
      );
      continue;
    }

    // Get guild from DB
    const guildId = membershipRoleDoc.guild;
    const guildDoc = await GuildCollection.findById(guildId);

    // Remove membership role and records if guild does not exist in DB
    if (guildDoc === null) {
      await Logger.sysLog(
        `Failed to find the server ${guildId} which the role <@&${membershipRoleId}> belongs to in the database.`,
        'check-auth-membership',
      );
      continue;
    }

    // Get YouTube channel from DB
    const youTubeChannelId = membershipRoleDoc.youtube;
    const youTubeChannelDoc = await YouTubeChannelCollection.findById(youTubeChannelId);
    if (youTubeChannelDoc === null) {
      await Logger.sysLog(
        `Failed to find the YouTube channel \`${youTubeChannelId}\` which the role <@&${membershipRoleId}> belongs to in the database.`,
        'check-auth-membership',
      );
      continue;
    }

    // Check membership
    for (const membershipDoc of membershipDocGroup) {
      const userId = membershipDoc.user;
      const userDoc = userId in userDocRecord ? userDocRecord[userId] : null;

      // Verify the user's membership via Google API
      const refreshToken =
        userDoc !== null && userDoc.youtube !== null
          ? symmetricDecrypt(userDoc.youtube.refreshToken, Env.DATA_ENCRYPTION_KEY)
          : null;

      let verifySuccess = false;
      if (refreshToken !== null) {
        let retry: number;
        for (retry = 0; retry < 3 && verifySuccess === false; retry++) {
          const randomVideoId =
            youTubeChannelDoc.memberOnlyVideoIds[
              Math.floor(Math.random() * youTubeChannelDoc.memberOnlyVideoIds.length)
            ];
          const googleApi = new GoogleAPI(Env.GOOGLE_CLIENT_ID, Env.GOOGLE_CLIENT_SECRET);
          const result = await googleApi.verifyYouTubeMembership(refreshToken, randomVideoId);
          console.log(randomVideoId, result.success ? 'success' : result.error);
          if (result.success === true) {
            verifySuccess = true;
          } else if (result.error === 'forbidden' || result.error === 'token_expired_or_revoked') {
            verifySuccess = false;
            break;
          } else if (result.error === 'video_not_found' || result.error === 'comment_disabled') {
            // Try again for another random members-only video
          } else {
            // ! Unknown error, currently we let it pass
            verifySuccess = true;
            await Logger.sysLog(
              `An unknown error occurred while verifying the user's membership for the YouTube channel \`${youTubeChannelDoc.profile.title}\` via Google API.`,
              'check-auth-membership',
            );
          }
        }
        if (retry === 3) {
          // ! Failed more than 3 times, currently we let it pass
          await Logger.sysLog(
            `Failed to verify the user's membership for the YouTube channel \`${youTubeChannelDoc.profile.title}\` via Google API after retry 3 times.`,
            'check-auth-membership',
          );
          continue;
        }
      }

      // If the user has the membership, extend the end date to 30 days after today
      const currentDate = dayjs.utc().startOf('day');
      if (verifySuccess) {
        membershipDoc.end = currentDate.add(30, 'day').toDate();
        await membershipDoc.save();
        continue;
      }

      // If not, and the end date is before today, remove the user's membership
      const endDate = dayjs.utc(membershipDoc.end).startOf('day');
      if (endDate.isBefore(currentDate, 'date')) {
        await removeMembership({
          guildId,
          membershipDoc,
          membershipRoleDoc,
          removeReason: 'we cannot verify your membership from YouTube API',
        });
        removalCount += 1;
      }
    }
  }

  await Logger.sysLog(
    `Finished checking auth membership.\n` + `Removed ${removalCount} expired memberships.`,
    'check-auth-membership',
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ removalCount }),
    headers: { 'Content-Type': 'application/json' },
  };
};
