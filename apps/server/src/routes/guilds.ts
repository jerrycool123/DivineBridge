import {
  GuildCollection,
  MembershipDoc,
  MembershipRoleDoc,
  ReadGuildRequest,
  UserCollection,
  YouTubeChannelDoc,
  symmetricDecrypt,
  symmetricEncrypt,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';

import { DiscordService } from '../services/discord.js';
import { Env } from '../utils/env.js';

export class GuildsRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/guilds' });
  }

  public async [methods.GET](request: ApiRequest, response: ApiResponse) {
    const { session } = request;
    if (session === undefined) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user has authorized with Discord
    const userDoc = await UserCollection.findById(session.id).populate<{
      memberships: MembershipDoc[];
    }>('memberships');
    if (userDoc === null) {
      return response.status(400).json({ message: 'User not found' });
    } else if (userDoc.refreshToken === null) {
      return response.status(401).json({ message: 'You have not authorized with Discord' });
    }
    const refreshToken = symmetricDecrypt(userDoc.refreshToken, Env.DATA_ENCRYPTION_KEY);
    if (refreshToken === null) {
      return response.status(500).json({
        message: 'An error occurred while retrieving your data. Please sign in again.',
      });
    }
    const result = await DiscordService.getAccessToken(refreshToken);
    if (!result.success) {
      return response.status(500).json({
        message: 'An error occurred while retrieving your data. Please sign in again.',
      });
    }
    const { accessToken, newRefreshToken } = result;
    const newEncryptedRefreshToken = symmetricEncrypt(newRefreshToken, Env.DATA_ENCRYPTION_KEY);
    if (newEncryptedRefreshToken === null) {
      return response.status(500).json({
        message: 'An error occurred while retrieving your data. Please sign in again.',
      });
    }
    userDoc.refreshToken = newEncryptedRefreshToken;
    await userDoc.save();

    // Get guilds from Discord API
    const guilds = await DiscordService.getGuilds(accessToken);

    // Get guilds from database
    const guildDocs = await GuildCollection.find({
      _id: { $in: guilds.map((guild) => guild.id) },
    }).populate<{
      membershipRoles: (Omit<MembershipRoleDoc, 'youtube'> & {
        youtube: YouTubeChannelDoc | null;
      })[];
    }>({
      path: 'membershipRoles',
      populate: {
        path: 'youtube',
      },
    });

    const membershipRecord = userDoc.memberships.reduce<Record<string, MembershipDoc>>(
      (prev, membership) => ({ ...prev, [membership.membershipRole]: membership }),
      {},
    );
    const resBody: ReadGuildRequest['res'] = guildDocs.map((guildDoc) => {
      return {
        id: guildDoc._id,
        profile: {
          name: guildDoc.profile.name,
          icon: guildDoc.profile.icon,
        },
        membershipRoles: guildDoc.membershipRoles
          .filter(
            (
              membershipRoleDoc,
            ): membershipRoleDoc is Omit<MembershipRoleDoc, 'youtube'> & {
              youtube: YouTubeChannelDoc;
            } => membershipRoleDoc.youtube !== null,
          )
          .map((membershipRoleDoc) => {
            const membership =
              membershipRoleDoc._id in membershipRecord
                ? membershipRecord[membershipRoleDoc._id]
                : null;
            return {
              id: membershipRoleDoc._id,
              profile: {
                name: membershipRoleDoc.profile.name,
                color: membershipRoleDoc.profile.color,
              },
              config: {
                aliasCommandName: membershipRoleDoc.config.aliasCommandName,
              },
              guild: membershipRoleDoc.guild,
              youtube: {
                id: membershipRoleDoc.youtube._id,
                profile: {
                  title: membershipRoleDoc.youtube.profile.title,
                  description: membershipRoleDoc.youtube.profile.description,
                  customUrl: membershipRoleDoc.youtube.profile.customUrl,
                  thumbnail: membershipRoleDoc.youtube.profile.thumbnail,
                },
                createdAt: membershipRoleDoc.youtube.createdAt.toISOString(),
                updatedAt: membershipRoleDoc.youtube.updatedAt.toISOString(),
              },
              membership:
                membership !== null
                  ? {
                      id: membership._id.toString(),
                      user: membership.user,
                      membershipRole: membership.membershipRole,
                      type: membership.type,
                      begin: membership.begin.toISOString(),
                      end: membership.end.toISOString(),
                      createdAt: membership.createdAt.toISOString(),
                      updatedAt: membership.updatedAt.toISOString(),
                    }
                  : null,
              createdAt: membershipRoleDoc.createdAt.toISOString(),
              updatedAt: membershipRoleDoc.updatedAt.toISOString(),
            };
          }),
        createdAt: guildDoc.createdAt.toISOString(),
        updatedAt: guildDoc.updatedAt.toISOString(),
      };
    });
    return response.status(200).json(resBody);
  }
}
