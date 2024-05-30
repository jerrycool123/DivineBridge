'use client';

import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Spin from 'antd/es/spin';
import { signIn, useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useClientTranslation } from '../../../../libs/client/i18n';

export default function Login() {
  const { lng } = useParams();
  const { t } = useClientTranslation(lng);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') {
      return;
    } else if (status === 'authenticated') {
      const url = new URL(window.location.href);
      const callbackUrl = url.searchParams.get('callbackUrl') ?? '/dashboard';
      router.push(callbackUrl);
    } else {
      console.log('Sign in');
      void signIn('discord');
    }
  }, [router, status]);

  return (
    <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <div className="poppins mb-4 fs-5 fw-500 text-white">{t('web.Loading')}...</div>
      <Spin className="mb-5" indicator={<LoadingOutlined className="text-white fs-2" spin />} />
    </div>
  );
}
