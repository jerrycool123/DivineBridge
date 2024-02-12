'use client';

import CaretDownOutlined from '@ant-design/icons/CaretDownOutlined';
import { ItemType } from 'antd/es/menu/hooks/useItems';
import Dropdown from 'antd/lib/dropdown';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DiscordLoginButton } from 'react-social-login-buttons';

import styles from './Navbar.module.css';

import SettingsModal from '../Modals/SettingsModal';

export default function Navbar() {
  const { data: session, status } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const items: ItemType[] = [
    {
      key: 'dashboard',
      label: (
        <Link className="text-decoration-none" href="/dashboard">
          Dashboard
        </Link>
      ),
    },
    {
      key: 'settings',
      label: (
        <div role="button" onClick={() => setIsModalOpen(true)}>
          Settings
        </div>
      ),
    },
    {
      key: 'sign-out',
      label: (
        <div role="button" className="text-danger" onClick={() => signOut({ callbackUrl: '/' })}>
          Sign Out
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

          {status === 'loading' ? (
            <></>
          ) : status === 'authenticated' ? (
            <Dropdown menu={{ items }}>
              <div
                role="button"
                className={`user-select-none d-flex align-items-center ${styles.user}`}
              >
                <div className={`${styles.avatar} position-relative me-2`}>
                  <Image className="rounded-circle" src={session.user.image} alt="avatar" fill />
                </div>
                <div className={`fs-7 me-2 ${styles.username}`}>{session.user.username}</div>
                <CaretDownOutlined />
              </div>
            </Dropdown>
          ) : (
            <div>
              <DiscordLoginButton
                text="Sign in"
                className={`${styles.signInButton} text-nowrap`}
                onClick={() => signIn('discord', { callbackUrl: '/dashboard' })}
              />
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
