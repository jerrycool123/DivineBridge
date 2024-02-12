import { AntdRegistry } from '@ant-design/nextjs-registry';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SessionProvider } from 'next-auth/react';
import type { PropsWithChildren } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';

import '../styles/globals.css';

import { publicEnv } from '../libs/common/public-env';

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
