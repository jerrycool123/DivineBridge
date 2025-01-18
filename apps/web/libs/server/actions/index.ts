import { Database } from '@divine-bridge/common';
import { createSafeActionClient } from 'next-safe-action';

import { auth } from '../../../auth';
import dbConnect from '../mongoose';

export const publicAction = createSafeActionClient({
  handleServerError(e) {
    return e.message;
  },
});

export const authAction = publicAction.use(async ({ next }) => {
  // Check if user has signed in
  const session = await auth();
  if (session === null) {
    throw new Error('Unauthorized');
  }

  // Upsert user
  const {
    user: { id, name, image, locale },
  } = session;
  await dbConnect();
  const userDoc = await Database.upsertUser({ id, name, image, locale });

  // return { session, userDoc, locale };
  return next({ ctx: { session, userDoc, locale } });
});
