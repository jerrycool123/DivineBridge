'use server';

import {
  DiscordOAuthAPI,
  GuildCollection,
  MembershipDoc,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { authAction } from '.';
import type { GetGuildsActionData } from '../../../types/server-actions';
import { getJWTFromCookie } from '../authjs';

const getGuildsActionInputSchema = z.object({});

export const getGuildsAction = authAction<typeof getGuildsActionInputSchema, GetGuildsActionData>(
  getGuildsActionInputSchema,
  async (_input, { userDoc }) => {
    // Populate UserDoc
    const populatedUserDoc = await userDoc.populate<{
      memberships: MembershipDoc[];
    }>('memberships');

    // Get access token from cookie
    const cookieStore = cookies();
    const { access_token: accessToken } = await getJWTFromCookie(cookieStore);

    // Get guilds from Discord API
    const discordOAuthApi = new DiscordOAuthAPI(accessToken);
    const guildsResult = await discordOAuthApi.getGuilds();
    if (!guildsResult.success) {
      throw new Error(guildsResult.error);
    }
    const { guilds } = guildsResult;

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

    const membershipRecord = populatedUserDoc.memberships.reduce<Record<string, MembershipDoc>>(
      (prev, membership) => ({ ...prev, [membership.membershipRole]: membership }),
      {},
    );
    return guildDocs.map((guildDoc): GetGuildsActionData[number] => {
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
          .map((membershipRoleDoc): GetGuildsActionData[number]['membershipRoles'][number] => {
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
  },
);
