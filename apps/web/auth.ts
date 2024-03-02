import NextAuth from 'next-auth';
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
          ...(profile !== undefined ? { locale: profile.locale as string } : {}),
        };
      } else if (Date.now() > token.expires_at * 1000) {
        return null;
      }
      return token;
    },
    session: ({ session, ...args }) => {
      if ('token' in args) {
        const { sub, name, picture, locale } = args.token;
        session.user = { id: sub, name, image: picture, locale };
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
