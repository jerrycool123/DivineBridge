'use server';

import {
  AppEventLogService,
  DiscordOAuthAPI,
  GuildDoc,
  MembershipRoleCollection,
  MembershipService,
  YouTubeChannelDoc,
  YouTubeOAuthAPI,
} from '@divine-bridge/common';
import { defaultLocale } from '@divine-bridge/i18n';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import dedent from 'dedent';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { authAction } from '.';
import { VerifyAuthMembershipActionData } from '../../../types/server-actions';
import { getJWTFromCookie } from '../authjs';
import { cryptoUtils } from '../crypto';
import { discordBotApi } from '../discord';
import { googleOAuth } from '../google';
import { getServerTranslation } from '../i18n';
import { logger } from '../logger';

dayjs.extend(utc);

const verifyAuthMembershipActionInputSchema = z.object({
  membershipRoleId: z.string(),
});

export const verifyAuthMembershipAction = authAction
  .schema(verifyAuthMembershipActionInputSchema)
  .action<VerifyAuthMembershipActionData>(
    async ({ parsedInput: { membershipRoleId }, ctx: { session, userDoc } }) => {
      const userLocale = session.user.locale;
      const { original_t: t, t: user_t } = await getServerTranslation(session.user.locale);

      // Check if user has connected their YouTube account
      if (userDoc.youtube === null) {
        throw new Error('You have not connected your YouTube account');
      }

      // Check if membership role exists
      const membershipRoleDoc = await MembershipRoleCollection.findById(membershipRoleId)
        .populate<{ guild: GuildDoc | null }>('guild')
        .populate<{ youtube: YouTubeChannelDoc | null }>('youtube');
      if (membershipRoleDoc === null) {
        throw new Error(user_t('web.Membership role not found'));
      } else if (membershipRoleDoc.guild === null) {
        logger.error(
          `Cannot retrieve the server that owns the membership role <@&${membershipRoleDoc._id}> from the database.`,
        );
        throw new Error(
          dedent`
        ${user_t('web.Cannot retrieve the server that owns the membership role from the database')}
        ${user_t('web.Please contact the bot owner to fix this issue')}
      `,
        );
      } else if (membershipRoleDoc.youtube === null) {
        logger.error(
          `Cannot retrieve the corresponding YouTube channel of the membership role <@&${membershipRoleDoc._id}> from the database.`,
        );
        throw new Error(
          dedent`
        ${user_t('web.Cannot retrieve the corresponding YouTube channel of the membership role from the database')}
        ${user_t('web.Please contact the bot owner to fix this issue')}
      `,
        );
      }

      // Get access token from cookie
      const cookieStore = await cookies();
      const { access_token: accessToken } = await getJWTFromCookie(cookieStore);

      // Check if user is a member of the guild that owns the membership role
      const discordOAuthApi = new DiscordOAuthAPI(accessToken);
      const guildsResult = await discordOAuthApi.getGuilds();
      if (
        !(guildsResult.success ? guildsResult.guilds : []).some(
          (guild) => guild.id === membershipRoleDoc.guild?._id,
        )
      ) {
        // ? In order to prevent users from using the website to access guilds that they are not a member of,
        // ? we will not return an error here. Instead, we will return a not found error.
        throw new Error(user_t('web.Membership role not found'));
      }
      const guildDoc = membershipRoleDoc.guild;
      const guildLocale = guildDoc.config.locale ?? defaultLocale;

      // Check if the guild exists, and the bot and the user is in the guild
      const guildResult = await discordBotApi.fetchGuild(guildDoc._id);
      if (!guildResult.success) {
        throw new Error(
          dedent`
        ${user_t('web.The bot is not in the server')} '${guildDoc.profile.name}' +
        ${user_t('web.Please contact the server moderators to fix this issue')}
      `,
        );
      }
      const memberResult = await discordBotApi.fetchGuildMember(guildDoc._id, userDoc._id);
      if (!memberResult.success) {
        throw new Error(user_t('web.You are not a member of the server'));
      }

      // Auth membership check
      const decryptResult = cryptoUtils.decrypt(userDoc.youtube.refreshToken);
      if (!decryptResult.success) {
        logger.error(`Failed to decrypt YouTube refresh token for user <@${userDoc._id}>`);
        throw new Error(
          user_t('web.Internal Server Error Please contact the bot owner to fix this issue'),
        );
      }
      const { plain: refreshToken } = decryptResult;
      const randomVideoId =
        membershipRoleDoc.youtube.memberOnlyVideoIds[
          Math.floor(Math.random() * membershipRoleDoc.youtube.memberOnlyVideoIds.length)
        ];
      const youtubeOAuthApi = new YouTubeOAuthAPI(logger, googleOAuth, refreshToken);
      const verifyResult = await youtubeOAuthApi.verifyMembership(randomVideoId);
      if (!verifyResult.success) {
        if (
          verifyResult.error === 'token_expired_or_revoked' ||
          verifyResult.error === 'invalid_grant'
        ) {
          throw new Error(
            user_t('web.Your YouTube authorization token has been expired or revoked'),
          );
        } else if (verifyResult.error === 'forbidden') {
          throw new Error(
            user_t('web.You do not have the YouTube channel membership of this channel'),
          );
        } else if (
          verifyResult.error === 'comment_disabled' ||
          verifyResult.error === 'video_not_found'
        ) {
          logger.error(
            dedent`
          Failed to retrieve the members-only video of the YouTube channel <@&${membershipRoleDoc._id}>.
          Error: ${verifyResult.error}
          Random video ID: ${randomVideoId}
        `,
          );
          throw new Error(
            dedent`
          ${user_t('web.Failed to retrieve the members-only video of the YouTube channel')}
          ${user_t('web.Please try again If the problem persists please contact the bot owner')}
        `,
          );
        } else {
          logger.error(
            dedent`
          An unknown error occurred when trying to verify the YouTube membership of user <@${userDoc._id}>
          YouTube channel ID: ${membershipRoleDoc.youtube.id}
          Random video ID: ${randomVideoId}
        `,
          );
          throw new Error(
            dedent`
          ${user_t('web.An unknown error occurred when trying to verify your YouTube membership')}
          ${user_t('web.Please try again If the problem persists please contact the bot owner')}
        `,
          );
        }
      }

      // Initialize log service and membership service
      const appEventLogService = await new AppEventLogService(
        (key) => t(key, guildLocale),
        logger,
        discordBotApi,
        guildDoc._id,
      ).init();
      const membershipService = new MembershipService(t, discordBotApi, appEventLogService);

      // Add membership to user
      const currentDate = dayjs.utc().startOf('day');
      const endDate = currentDate.add(30, 'days');
      const addMembershipResult = await membershipService.add({
        userLocale,
        guildLocale,
        guildId: guildDoc._id,
        guildName: guildDoc.profile.name,
        membershipRoleDoc,
        userPayload: {
          id: userDoc._id,
          name: userDoc.profile.username,
          image: userDoc.profile.image,
        },
        type: 'auth',
        begin: currentDate,
        end: endDate,
      });
      if (!addMembershipResult.success) {
        throw new Error(
          dedent`
        ${user_t('web.Sorry an error occurred while assigning the membership role to you')}
        ${user_t('web.Please try again later')}
      `,
        );
      }
      const { updatedMembershipDoc } = addMembershipResult;

      return {
        id: updatedMembershipDoc._id.toString(),
        type: updatedMembershipDoc.type,
        user: updatedMembershipDoc.user,
        membershipRole: updatedMembershipDoc.membershipRole,
        begin: updatedMembershipDoc.begin.toISOString(),
        end: updatedMembershipDoc.end.toISOString(),
        createdAt: updatedMembershipDoc.createdAt.toISOString(),
        updatedAt: updatedMembershipDoc.updatedAt.toISOString(),
      };
    },
  );
