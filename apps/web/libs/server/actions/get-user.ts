'use server';

import { z } from 'zod';

import { authAction } from '.';
import { GetUserActionData } from '../../../types/server-actions';

const getUserActionInputSchema = z.object({});

export const getUserAction = authAction<typeof getUserActionInputSchema, GetUserActionData>(
  getUserActionInputSchema,
  async (_input, { userDoc }) => {
    return {
      id: userDoc._id,
      profile: {
        username: userDoc.profile.username,
        image: userDoc.profile.image,
      },
      youtube:
        userDoc.youtube !== null
          ? {
              id: userDoc.youtube.id,
              title: userDoc.youtube.title,
              customUrl: userDoc.youtube.customUrl,
              thumbnail: userDoc.youtube.thumbnail,
            }
          : null,
      createdAt: userDoc.createdAt.toISOString(),
      updatedAt: userDoc.updatedAt.toISOString(),
    };
  },
);
