'use client';

import { DiscordLoginButton as DiscordLoginBtn } from 'react-social-login-buttons';

import styles from './DiscordLoginButton.module.css';

import { useClientTranslation } from '../../libs/client/i18n';
import { getDiscordBotInviteLink } from '../../libs/common/discord';

export default function DiscordLoginButton({ lng }: { lng: string | string[] | undefined }) {
  const { t } = useClientTranslation(lng);

  return (
    <DiscordLoginBtn
      text={t('web.Invite Divine Bridge to your server')}
      className={`${styles.C2AButton} text-nowrap`}
      onClick={() => {
        const popupWinWidth = 980,
          popupWinHeight = 700;
        const left = (screen.width - popupWinWidth) / 2;
        const top = (screen.height - popupWinHeight) / 4;
        setTimeout(() => {
          window.open(
            getDiscordBotInviteLink(),
            '_blank',
            `resizable=yes, width= ${popupWinWidth.toString()}, height=${popupWinHeight.toString()}, top=${top.toString()}, left=${left.toString()}`,
          );
        });
      }}
    />
  );
}
