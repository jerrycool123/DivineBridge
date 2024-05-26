'use client';

import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Dropdown from 'antd/es/dropdown';
import { ItemType } from 'antd/es/menu/hooks/useItems';
import Spin from 'antd/es/spin';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { DiscordLoginButton } from 'react-social-login-buttons';

import styles from './Navbar.module.css';

import { useClientTranslation } from '../../libs/client/i18n';
import SettingsModal from '../Modals/SettingsModal';

export default function Navbar() {
  const { lng } = useParams();
  const language = lng === undefined ? 'en-US' : Array.isArray(lng) ? lng[0] : lng;
  const { t } = useClientTranslation(lng);
  const { data: session, status } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const items: ItemType[] = [
    {
      key: 'dashboard',
      label: (
        <Link className="text-decoration-none" href="/dashboard">
          {t('web.Dashboard')}
        </Link>
      ),
    },
    {
      key: 'settings',
      label: (
        <div role="button" onClick={() => setIsModalOpen(true)}>
          {t('web.Settings')}
        </div>
      ),
    },
    {
      key: 'sign-out',
      label: (
        <div role="button" className="text-danger" onClick={() => signOut({ callbackUrl: '/' })}>
          {t('web.Sign Out')}
        </div>
      ),
    },
  ];

  return (
    <>
      {status === 'authenticated' && (
        <SettingsModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      )}
      <nav className={`navbar navbar-expand-lg ${styles.navbar}`}>
        <div className="container">
          <div>
            <Link className="navbar-brand" href="/">
              <Image src="/logo.png" alt="logo" width="40" height="40" />
            </Link>
            <Link className={`fs-5 text-decoration-none fw-700 ${styles.brand}`} href="/">
              Divine Bridge
            </Link>
          </div>
          <div className="d-flex align-items-center">
            <Link className="me-4 link-white" href={`/${language}/docs/user-tutorial`}>
              {t('web.Docs')}
            </Link>
            {status === 'loading' ? (
              <Spin indicator={<LoadingOutlined className="text-white" />} />
            ) : status === 'authenticated' ? (
              <Dropdown menu={{ items }}>
                <div
                  role="button"
                  className={`user-select-none d-flex align-items-center ${styles.user}`}
                >
                  <div className={`${styles.avatar} position-relative me-2`}>
                    <Image className="rounded-circle" src={session.user.image} alt="avatar" fill />
                  </div>
                  <div className={`fs-7 me-2 ${styles.username}`}>{session.user.name}</div>
                  <CaretDownOutlined />
                </div>
              </Dropdown>
            ) : (
              <div>
                <DiscordLoginButton
                  text={t('web.Sign In')}
                  className={`${styles.signInButton} text-nowrap`}
                  onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
                />
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
