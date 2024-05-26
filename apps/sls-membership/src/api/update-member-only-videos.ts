import { YouTubeChannelCollection } from '@divine-bridge/common';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dedent from 'dedent';

import { checkAuth } from '../utils/auth.js';
import { updateMemberOnlyVideosLogger as logger } from '../utils/logger.js';
import { dbConnect } from '../utils/mongoose.js';
import { sleep } from '../utils/sleep.js';
import { youtubeApiKeyApi } from '../utils/youtube.js';

dayjs.extend(utc);

export const updateMemberOnlyVideos = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  logger.debug(event);
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  logger.info(`Start updating member-only videos.`);
  await dbConnect(logger);

  // Get YouTube channels from DB
  const youtubeChannelDocs = await YouTubeChannelCollection.find().populate<{
    membershipRoles: { _id: string }[];
  }>({ path: 'membershipRoles', select: '_id' });
  const differenceRatios: { id: string; title: string; ratio: number }[] = [];
  for (const youtubeChannelDoc of youtubeChannelDocs) {
    // Skip channels without membership roles
    if (youtubeChannelDoc.membershipRoles.length === 0) {
      continue;
    }

    try {
      // Fetch member only video IDs
      const itemsResult = await youtubeApiKeyApi.getMemberOnlyPlaylistItems(youtubeChannelDoc._id);
      const memberOnlyVideoIds = (itemsResult.success ? itemsResult.items : []).map(
        (item) => item.contentDetails.videoId,
      );
      if (memberOnlyVideoIds.length === 0) {
        logger.error(
          `⚠️⚠️⚠️ ALERT ⚠️⚠️⚠️ Could not find any member only videos for the YouTube channel ${youtubeChannelDoc.profile.title} (${youtubeChannelDoc._id})`,
        );
        continue;
      } else if (memberOnlyVideoIds.length < youtubeChannelDoc.memberOnlyVideoIds.length) {
        logger.error(
          `⚠️⚠️⚠️ ALERT ⚠️⚠️⚠️ Found less member only videos for the YouTube channel ${youtubeChannelDoc.profile.title} (${youtubeChannelDoc._id}) than before.`,
        );
        continue;
      }

      // Calculate the difference ratio of the two sets to ensure there are no weird situations
      // ? (i.e. YouTube API Error, Channel suspended, etc.)
      const oldSet = new Set(youtubeChannelDoc.memberOnlyVideoIds);
      const newSet = new Set(memberOnlyVideoIds);
      const intersection = new Set([...oldSet].filter((x) => newSet.has(x)));
      const differenceRatio = 1 - intersection.size / oldSet.size;
      differenceRatios.push({
        id: youtubeChannelDoc._id,
        title: youtubeChannelDoc.profile.title,
        ratio: differenceRatio,
      });
      if (differenceRatio >= 0.5) {
        logger.error(
          `⚠️⚠️⚠️ ALERT ⚠️⚠️⚠️ The difference ratio of the member only videos for the YouTube channel ${youtubeChannelDoc._id} is ${differenceRatio}%, which is higher than 50%.`,
        );
        continue;
      }

      // Update member only videos in DB
      await youtubeChannelDoc.updateOne({
        $set: { memberOnlyVideoIds },
      });
    } catch (error) {
      logger.error(error);
      logger.error(
        `Error while updating member-only videos for YouTube channel ${youtubeChannelDoc.profile.title}`,
      );
    }
  }

  logger.info(
    dedent`
      Finished updating member-only videos.
      Difference Ratios:
      ${differenceRatios
        .map((diff) => `- \`${diff.title} (${diff.id})\`: ${Math.round(diff.ratio * 100)}%`)
        .join('\n')}
    `,
  );

  // ? Wait for 1 second to ensure the log is sent
  await sleep(1);
  return {
    statusCode: 200,
    body: JSON.stringify({
      differenceRatios,
    }),
    headers: { 'Content-Type': 'application/json' },
  };
};
