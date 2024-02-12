import { z } from 'zod';

export const membershipResourceSchema = z.object({
  id: z.string(),
  user: z.string(),
  type: z.enum(['manual', 'screenshot', 'auth', 'live_chat']),
  membershipRole: z.string(),
  begin: z.string(),
  end: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MembershipResource = z.infer<typeof membershipResourceSchema>;

export const membershipRoleResourceSchema = z.object({
  id: z.string(),
  profile: z.object({
    name: z.string(),
    color: z.number(),
  }),
  guild: z.string(),
  youtube: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MembershipRoleResource = z.infer<typeof membershipRoleResourceSchema>;

export const guildResourceSchema = z.object({
  id: z.string(),
  profile: z.object({
    name: z.string(),
    icon: z.string().nullable(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type GuildResource = z.infer<typeof guildResourceSchema>;

export const userResourceSchema = z.object({
  id: z.string(),
  profile: z.object({
    username: z.string(),
    image: z.string(),
  }),
  youtube: z
    .object({
      id: z.string(),
      title: z.string(),
      customUrl: z.string(),
      thumbnail: z.string(),
    })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserResource = z.infer<typeof userResourceSchema>;

export const youtubeChannelResourceSchema = z.object({
  id: z.string(),
  profile: z.object({
    title: z.string(),
    description: z.string(),
    customUrl: z.string(),
    thumbnail: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type YouTubeChannelResource = z.infer<typeof youtubeChannelResourceSchema>;
