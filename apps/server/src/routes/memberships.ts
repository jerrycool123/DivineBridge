import {
  GoogleAPI,
  GuildDoc,
  MembershipDoc,
  MembershipRoleCollection,
  UserCollection,
  VerifyMembershipRequest,
  YouTubeChannelDoc,
  symmetricDecrypt,
  symmetricEncrypt,
  verifyMembershipRequestSchema,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { z } from 'zod';

import { Embeds } from '../components/embeds.js';
import { DiscordService } from '../services/discord.js';
import { MembershipService } from '../services/membership.js';
import { Env } from '../utils/env.js';
import { Fetchers } from '../utils/fetchers.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

dayjs.extend(utc);

export class MembershipsRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/memberships/:membershipRoleId' });
  }

  public async [methods.POST](request: ApiRequest, response: ApiResponse) {
    const { session } = request;
    if (session === undefined) {
      return response.unauthorized();
    }

    const requestSchema = verifyMembershipRequestSchema.extend({ res: z.unknown() });
    const parsedRequest = requestSchema.safeParse(request);
    if (!parsedRequest.success) {
      return response.badRequest(parsedRequest.error);
    }
    const { params } = parsedRequest.data;
    const { membershipRoleId } = params;

    const userDoc = await UserCollection.findById(session.id).populate<{
      memberships: MembershipDoc[];
    }>('memberships');
    if (userDoc === null) {
      return response.badRequest('User not found');
    } else if (userDoc.refreshToken === null) {
      return response.unauthorized('You have not authorized with Discord');
    } else if (userDoc.youtube === null) {
      return response.badRequest('You have not linked your YouTube channel');
    }
    const refreshToken = symmetricDecrypt(userDoc.refreshToken, Env.DATA_ENCRYPTION_KEY);
    if (refreshToken === null) {
      return response
        .status(500)
        .text('An error occurred while retrieving your data. Please sign in again.');
    }
    const result = await DiscordService.getAccessToken(refreshToken);
    if (!result.success) {
      return response
        .status(500)
        .text('An error occurred while retrieving your data. Please sign in again.');
    }
    const { accessToken, newRefreshToken } = result;
    const newEncryptedRefreshToken = symmetricEncrypt(newRefreshToken, Env.DATA_ENCRYPTION_KEY);
    if (newEncryptedRefreshToken === null) {
      return response
        .status(500)
        .text('An error occurred while retrieving your data. Please sign in again.');
    }
    userDoc.refreshToken = newEncryptedRefreshToken;

    // Check if membership role exists
    const membershipRoleDoc = await MembershipRoleCollection.findById(membershipRoleId)
      .populate<{ guild: GuildDoc | null }>('guild')
      .populate<{ youtube: YouTubeChannelDoc | null }>('youtube');
    if (membershipRoleDoc === null) {
      return response.notFound('Membership role not found');
    } else if (membershipRoleDoc.guild === null) {
      return response
        .status(500)
        .text(
          'Cannot retrieve the server that owns the membership role from the database.\n' +
            'Please contact the bot owner to fix this issue.',
        );
    } else if (membershipRoleDoc.youtube === null) {
      return response
        .status(500)
        .text(
          'Cannot retrieve the corresponding YouTube channel of the membership role from the database.\n' +
            'Please contact the bot owner to fix this issue.',
        );
    }

    // Check if user is a member of the guild that owns the membership role
    const guilds = await DiscordService.getGuilds(accessToken);
    if (!guilds.some((guild) => guild.id === membershipRoleDoc.guild?._id)) {
      // ? In order to prevent users from using the website to access guilds that they are not a member of,
      // ? we will not return an error here. Instead, we will return a not found error.
      return response.notFound('Membership role not found');
    }
    const guildDoc = membershipRoleDoc.guild;

    // Check if the guild exists the bot is in the guild
    const guild = await Fetchers.fetchGuild(guildDoc._id);
    if (guild === null) {
      return response
        .status(500)
        .text(
          `The bot is not in the server '${guildDoc.profile.name}'.\n` +
            'Please contact the server moderators to fix this issue.',
        );
    }
    const member = await Fetchers.fetchGuildMember(guild, userDoc._id);
    if (member === null) {
      return response.badRequest('You are not a member of the server.');
    }

    // Check if the guild has a valid log channel
    const [guildOwner, logChannelResult] = await Promise.all([
      Fetchers.fetchGuildOwner(guild),
      Validators.isGuildHasLogChannel(guild),
    ]);
    if (guildOwner === null) {
      return response
        .status(500)
        .text(
          `The bot cannot find the owner of the server '${guildDoc.profile.name}'.\n` +
            'Please contact the server moderators to fix this issue.',
        );
    } else if (!logChannelResult.success) {
      return response
        .status(500)
        .text(
          `An error occurred: ${logChannelResult.error}\n` +
            'Please contact the server moderators to set one up first.',
        );
    }
    const logChannel = logChannelResult.data;

    // Auth membership check
    const youtubeRefreshToken = symmetricDecrypt(
      userDoc.youtube.refreshToken,
      Env.DATA_ENCRYPTION_KEY,
    );
    if (youtubeRefreshToken === null) {
      return response
        .status(500)
        .text(
          'An error occurred while retrieving your YouTube channel data. Please link your YouTube channel again.',
        );
    }
    const randomVideoId =
      membershipRoleDoc.youtube.memberOnlyVideoIds[
        Math.floor(Math.random() * membershipRoleDoc.youtube.memberOnlyVideoIds.length)
      ];
    const googleApi = new GoogleAPI(Env.GOOGLE_CLIENT_ID, Env.GOOGLE_CLIENT_SECRET);
    const verifyResult = await googleApi.verifyYouTubeMembership(
      youtubeRefreshToken,
      randomVideoId,
    );
    if (verifyResult.success === false) {
      if (verifyResult.error === 'token_expired_or_revoked') {
        return response
          .status(500)
          .text(
            'Your YouTube authorization token has been expired or revoked.\n' +
              'Please link your YouTube channel again.',
          );
      } else if (verifyResult.error === 'forbidden') {
        return response.forbidden('You do not have the YouTube channel membership of this channel');
      } else if (
        verifyResult.error === 'comment_disabled' ||
        verifyResult.error === 'video_not_found'
      ) {
        return response
          .status(500)
          .text(
            'Failed to retrieve the members-only video of the YouTube channel.\n' +
              'Please try again. If the problem persists, please contact the bot owner.',
          );
      } else if (verifyResult.error === 'unknown_error') {
        return response
          .status(500)
          .text(
            'An unknown error occurred when trying to verify your YouTube membership.\n' +
              'Please try again. If the problem persists, please contact the bot owner.',
          );
      }
    }

    // Add membership to user
    const currentDate = dayjs.utc().startOf('day');
    const endDate = currentDate.add(30, 'days');
    const addMembershipResult = await MembershipService.addMembership({
      guild,
      membershipRoleDoc,
      member,
      type: 'auth',
      begin: currentDate,
      end: endDate,
    });
    if (!addMembershipResult.success) {
      return response.badRequest(
        'Sorry, an error occurred while assigning the membership role to you.\n' +
          'Please try again later.',
      );
    }
    const { notified, updatedMembershipDoc } = addMembershipResult;

    // Send verified log
    const authMembershipEmbed = Embeds.authMembership(
      member.user,
      membershipRoleId,
      updatedMembershipDoc,
    );
    await Utils.sendEventLog({
      guildOwner,
      logChannel,
      payload: {
        content: notified
          ? ''
          : "**[NOTE]** Due to the user's __Privacy Settings__ of this server, **I cannot send DM to notify them.**\nYou might need to notify them yourself.",
        embeds: [authMembershipEmbed],
      },
    });

    const resBody: VerifyMembershipRequest['res'] = {
      id: updatedMembershipDoc._id.toString(),
      type: updatedMembershipDoc.type,
      user: updatedMembershipDoc.user,
      membershipRole: updatedMembershipDoc.membershipRole,
      begin: updatedMembershipDoc.begin.toISOString(),
      end: updatedMembershipDoc.end.toISOString(),
      createdAt: updatedMembershipDoc.createdAt.toISOString(),
      updatedAt: updatedMembershipDoc.updatedAt.toISOString(),
    };
    return response.created(resBody);
  }
}
