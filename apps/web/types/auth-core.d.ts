/* eslint-disable @typescript-eslint/no-unused-vars */
import { JWT } from '@auth/core/jwt';
import { Account, Profile, Session, User } from '@auth/core/types';

declare module '@auth/core/types' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      name: string;
      image: string;
    };
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    id: string;
    name: string;
    image: string;
  }

  /**
   * Usually contains information about the provider being used
   * and also extends `TokenSet`, which is different tokens returned by OAuth Providers.
   */
  interface Account {
    access_token: string;
    expires_at: number;
  }

  /** The OAuth profile returned from your provider */
  interface Profile {
    id: string;
    username: string;
    image_url: string;
  }
}

declare module '@auth/core/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    name: string;
    email: never;
    picture: string;
    access_token: string;
    expires_at: number;
    sub: string;
    iat: number;
    exp: number;
    jti: string;
  }
}
