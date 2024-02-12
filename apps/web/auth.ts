import { DiscordAuthRequest, symmetricEncrypt } from '@divine-bridge/common';
import { isAxiosError } from 'axios';
import NextAuth from 'next-auth';
import Discord from 'next-auth/providers/discord';

import { serverApi } from './libs/common/server';
import { privateEnv } from './libs/server/private-env';

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    Discord({
      authorization:
        'https://discord.com/api/oauth2/authorize?scope=identify+guilds&prompt=consent',
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account === null || account.refresh_token === undefined) return false;
      else if (account.provider === 'discord') {
        try {
          const encryptedToken = symmetricEncrypt(account.refresh_token, privateEnv.AUTH_SECRET);
          if (encryptedToken === null) {
            throw new Error('Failed to encrypt refresh token.');
          }
          await serverApi.post<DiscordAuthRequest>('/auth/discord', {
            token: encryptedToken,
          });
        } catch (error) {
          if (isAxiosError(error) && error.response !== undefined) {
            console.error(error.response.data);
          } else {
            console.error(error);
          }
          return false;
        }

        return true;
      }
      return false;
    },
    jwt({ token, profile }) {
      if (profile !== undefined) {
        token.user = {
          id: profile.id,
          username: profile.username,
          image: profile.image_url,
        };
      }
      return token;
    },
    session: (args) => {
      const { session } = args;
      if (session.user !== undefined && 'token' in args && args.token.sub !== undefined) {
        session.user = {
          id: args.token.user.id,
          username: args.token.user.username,
          image: args.token.user.image,
        };
      }
      return session;
    },
    async authorized({ request, auth }) {
      console.log({ request, auth });
      return true;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
});
