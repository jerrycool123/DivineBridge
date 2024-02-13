import { AntdRegistry } from '@ant-design/nextjs-registry';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import type { PropsWithChildren } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import '../styles/globals.css';

import { publicEnv } from '../libs/common/public-env';

export const metadata: Metadata = {
  title: 'Divine Bridge',
  description:
    'Divine Bridge is a Discord bot verifying YouTube channel memberships and link them with Discord server roles. It currently supports Screenshot Mode and Auth Mode.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <GoogleOAuthProvider clientId={publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
            <AntdRegistry>{children}</AntdRegistry>
          </GoogleOAuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
