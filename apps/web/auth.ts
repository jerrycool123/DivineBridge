import NextAuth, { Session } from 'next-auth';
import Discord from 'next-auth/providers/discord';

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
    jwt({ token, account = null, profile }) {
      if (account !== null && account.expires_at !== undefined) {
        const { access_token, expires_at } = account;
        return {
          ...token,
          access_token,
          expires_at,
          ...(profile !== undefined
            ? {
                user: {
                  id: profile.id as string,
                  name: profile.username,
                  image: profile.image_url,
                  locale: profile.locale as string,
                },
              }
            : {}),
        };
      } else if (Date.now() > token.expires_at * 1000) {
        return null;
      }
      return token;
    },
    session: ({ ...args }) => {
      const session = args.session as unknown as Session;
      if ('token' in args) {
        session.user = args.token.user;
      }
      return session;
    },
    authorized: async ({ auth }) => {
      return auth !== null;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days, align with Discord token expiration
  },
});
