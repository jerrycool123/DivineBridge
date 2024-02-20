import { CDN, DiscordAPIError, calculateUserDefaultAvatarIndex } from '@discordjs/rest';
import { APIUser } from 'discord-api-types/v10';
import { z } from 'zod';

import { UserPayload } from '../index.js';

export namespace DiscordUtils {
  export const membership = {
    accept: 'membership-accept',
    reject: 'membership-reject',
    modify: 'membership-modify',
  } as const;

  export const colors = {
    success: '#57F287',
    error: '#ED4245',
    request: '#1DA0F2',
    modified: '#FEE75C',
  } as const;

  const discordErrorDataSchema = z.object({
    code: z.number(),
    message: z.string(),
  });

  const oauthErrorDataSchema = z.object({
    error: z.string(),
    error_description: z.string(),
  });

  export const parseError = (error: unknown): string => {
    if (error instanceof DiscordAPIError) {
      const discordError = discordErrorDataSchema.safeParse(error.rawError);
      if (discordError.success) {
        return discordError.data.message;
      }
      const oauthError = oauthErrorDataSchema.safeParse(error.rawError);
      if (oauthError.success) {
        return `[${oauthError.data.error}] ${oauthError.data.error_description}`;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  };

  export const convertAPIUser = (user: APIUser): UserPayload => {
    const cdn = new CDN();
    return {
      id: user.id,
      name: user.username,
      image:
        user.avatar !== null
          ? cdn.avatar(user.id, user.avatar)
          : cdn.defaultAvatar(
              user.discriminator === '0'
                ? calculateUserDefaultAvatarIndex(user.id)
                : parseInt(user.discriminator) % 5,
            ),
    };
  };
}
