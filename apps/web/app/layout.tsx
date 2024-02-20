import { AntdRegistry } from '@ant-design/nextjs-registry';
import { GoogleAnalytics } from '@eisberg-labs/next-google-analytics';
import { GoogleOAuthProvider } from '@react-oauth/google';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import type { PropsWithChildren } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import '../styles/globals.css';

import { MainProvider } from '../contexts/MainContext';
import { publicEnv } from '../libs/common/public-env';

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_WEB_URL),
  title: 'Divine Bridge',
  description:
    'Divine Bridge is a Discord bot verifying YouTube channel memberships and link them with Discord server roles. It currently supports Screenshot Mode and Auth Mode.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <MainProvider>
        <GoogleOAuthProvider clientId={publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
          <AntdRegistry>
            <html lang="en">
              <GoogleAnalytics trackingId={publicEnv.NEXT_PUBLIC_ANALYTICS_ID} />
              <body>{children}</body>
            </html>
          </AntdRegistry>
        </GoogleOAuthProvider>
      </MainProvider>
    </SessionProvider>
  );
}
