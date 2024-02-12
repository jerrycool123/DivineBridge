import { z } from 'zod';

import {
  guildResourceSchema,
  membershipResourceSchema,
  membershipRoleResourceSchema,
  userResourceSchema,
  youtubeChannelResourceSchema,
} from './resource.js';

export const baseRequestSchema = z.object({
  body: z.unknown(),
  params: z.unknown(),
  query: z.unknown(),
  res: z.unknown(),
});
export type BaseRequest = z.infer<typeof baseRequestSchema>;

/**
 * Route: `POST /server/auth/discord`
 */
export const discordAuthRequestSchema = baseRequestSchema.extend({
  body: z.object({
    token: z.string(),
  }),
  res: z.object({
    id: z.string(),
  }),
});
export type DiscordAuthRequest = z.infer<typeof discordAuthRequestSchema>;

/**
 * Route: `POST /server/auth/google`
 */
export const googleAuthRequestSchema = baseRequestSchema.extend({
  body: z.object({
    code: z.string(),
  }),
  res: z.object({
    id: z.string(),
    title: z.string(),
    customUrl: z.string(),
    thumbnail: z.string(),
  }),
});
export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;

/**
 * Route: `GET /server/users/@me`
 */
export const readCurrentUserRequestSchema = baseRequestSchema.extend({
  res: userResourceSchema,
});
export type ReadCurrentUserRequest = z.infer<typeof readCurrentUserRequestSchema>;

/**
 * Route: `DELETE /server/users/@me`
 */
export const deleteCurrentUserRequestSchema = baseRequestSchema;
export type DeleteCurrentUserRequest = z.infer<typeof deleteCurrentUserRequestSchema>;

/**
 * Route: `POST /server/users/@me/revoke`
 */
export const revokeCurrentUserYouTubeRefreshTokenRequestSchema = baseRequestSchema.extend({
  res: z.object({
    message: z.literal('success'),
  }),
});
export type RevokeCurrentUserYouTubeRefreshTokenRequest = z.infer<
  typeof revokeCurrentUserYouTubeRefreshTokenRequestSchema
>;

/**
 * Route: `GET /server/guilds`
 */
export const readGuildRequestSchema = baseRequestSchema.extend({
  res: z.array(
    guildResourceSchema.extend({
      membershipRoles: z.array(
        membershipRoleResourceSchema.extend({
          youtube: youtubeChannelResourceSchema,
          membership: membershipResourceSchema.nullable(),
        }),
      ),
    }),
  ),
});
export type ReadGuildRequest = z.infer<typeof readGuildRequestSchema>;

/**
 * Route: `POST /server/memberships/verify `
 */
export const verifyMembershipRequestSchema = baseRequestSchema.extend({
  params: z.object({
    membershipRoleId: z.string(),
  }),
  res: membershipResourceSchema,
});
export type VerifyMembershipRequest = z.infer<typeof verifyMembershipRequestSchema>;
