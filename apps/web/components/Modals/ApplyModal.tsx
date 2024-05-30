'use client';

import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Modal from 'antd/es/modal/Modal';
import Spin from 'antd/es/spin';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Dispatch, SetStateAction, useContext, useState } from 'react';
import { DiscordLoginButton } from 'react-social-login-buttons';

import styles from './ApplyModal.module.css';

import { MainContext } from '../../contexts/MainContext';
import { useErrorHandler } from '../../hooks/error-handler';
import useYouTubeAuthorize from '../../hooks/youtube';
import { useClientTranslation } from '../../libs/client/i18n';
import { requiredAction } from '../../libs/common/action';
import { verifyAuthMembershipAction } from '../../libs/server/actions/verify-auth-membership';
import { GetGuildsActionData } from '../../types/server-actions';
import GoogleOAuthButton from '../Buttons/GoogleOAuthButton';

export default function ApplyModal({
  isModalOpen,
  setIsModalOpen,
  selectedMembershipRole,
  setSelectedMembershipRole,
}: {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  selectedMembershipRole: GetGuildsActionData[number]['membershipRoles'][number] | null;
  setSelectedMembershipRole: Dispatch<
    SetStateAction<GetGuildsActionData[number]['membershipRoles'][number] | null>
  >;
}) {
  const { lng } = useParams();
  const { t } = useClientTranslation(lng);
  const { user, guilds, setGuilds, messageApi } = useContext(MainContext);

  const [linkingAccount, setLinkingAccount] = useState(false);
  const [verifyingMembership, setVerifyingMembership] = useState(false);

  const isAuthMode = selectedMembershipRole?.membership?.type === 'auth';

  const errorHandler = useErrorHandler(messageApi);

  const authorize = useYouTubeAuthorize({
    setLinkingAccount,
    messageApi,
  });

  return (
    <Modal
      title={<div className="text-white">{t('web.Choose a Verification Mode')}</div>}
      className={styles.modal}
      open={isModalOpen}
      footer={null}
      centered
      onCancel={() => {
        setIsModalOpen(false);
        setSelectedMembershipRole(null);
      }}
    >
      {selectedMembershipRole !== null && (
        <>
          <div className="mt-3 mb-4">
            <div className="fs-6 mb-2 text-white fw-700 poppins">{t('common.Auth Mode')}</div>
            <div className="mb-2">
              <div className="mb-1">
                {t(
                  'web.You can link your YouTube account and authorize Divine Bridge to verify your membership for',
                )}{' '}
                <span
                  role="button"
                  className={`fw-700 ${styles.modalChannelTitle}`}
                  onClick={() => {
                    window.open(
                      `https://www.youtube.com/${selectedMembershipRole.youtube.profile.customUrl}`,
                      '_blank',
                    );
                  }}
                >
                  {selectedMembershipRole.youtube.profile.title}
                </span>
              </div>
              {user === null ||
                (user.youtube === null && (
                  <div className="fw-500 text-white">
                    {t('web.Please link your YouTube account to continue')}
                  </div>
                ))}
            </div>
            <div className="my-3 d-flex justify-content-center align-items-center">
              {linkingAccount ? (
                <div className={`flex-grow-1 d-flex justify-content-center ${styles.loadingBox}`}>
                  <Spin indicator={<LoadingOutlined className="text-white fs-4" spin />} />
                </div>
              ) : user === null || user.youtube === null ? (
                <div className="flex-grow-1">
                  <div className="w-100 mb-2 d-flex justify-content-center">
                    <GoogleOAuthButton className="flex-grow-1" onClick={() => authorize()} />
                  </div>
                  <div className={`flex-grow-1 position-relative ${styles.youtubeBranding}`}>
                    <Image
                      className="object-fit-contain"
                      src="/developed-with-youtube-sentence-case-light.png"
                      alt="developed with YouTube"
                      fill
                    />
                  </div>
                </div>
              ) : (
                <div className={`px-3 py-2 rounded d-flex flex-column ${styles.channelWrapper}`}>
                  <div className="mb-2 text-white fw-500 poppins">
                    {t('web.Your linked YouTube channel')}
                  </div>
                  <div className="d-flex align-items-center">
                    <Image
                      className="flex-shrink-0 rounded-circle"
                      src={user.youtube.thumbnail}
                      alt={`${user.youtube.title}'s icon`}
                      width={40}
                      height={40}
                    />
                    <div className={`flex-grow-1 ps-3 ${styles.channelInfo}`}>
                      <div
                        role="button"
                        className={`fs-6 text-truncate ${styles.channelTitle}`}
                        onClick={() =>
                          user.youtube !== null &&
                          window.open(`https://www.youtube.com/${user.youtube.customUrl}`, '_blank')
                        }
                      >
                        {user.youtube.title}
                      </div>
                      <div className="fs-8 text-truncate">{user.youtube.customUrl}</div>
                    </div>
                    <div
                      role="button"
                      className={`flex-shrink-0 ms-2 btn btn-success btn-sm ${
                        verifyingMembership || isAuthMode ? 'disabled' : ''
                      }`}
                      onClick={async () => {
                        setVerifyingMembership(true);
                        void messageApi.open({
                          key: 'verify-membership',
                          type: 'loading',
                          content: t('web.Verifying your membership'),
                          duration: 10,
                        });
                        try {
                          const data = await verifyAuthMembershipAction({
                            membershipRoleId: selectedMembershipRole.id,
                          })
                            .then(requiredAction)
                            .then(({ data }) => data);
                          setGuilds((oldGuilds) =>
                            oldGuilds !== null
                              ? oldGuilds.map((guild) =>
                                  guild.id !== selectedMembershipRole.guild
                                    ? guild
                                    : {
                                        ...guild,
                                        membershipRoles: guild.membershipRoles.map(
                                          (membershipRole) =>
                                            membershipRole.id !== selectedMembershipRole.id
                                              ? membershipRole
                                              : {
                                                  ...membershipRole,
                                                  membership: data,
                                                },
                                        ),
                                      },
                                )
                              : null,
                          );
                          void messageApi.open({
                            key: 'verify-membership',
                            type: 'success',
                            content: t('web.Successfully verified your membership'),
                            duration: 3,
                          });
                          setIsModalOpen(false);
                        } catch (error) {
                          messageApi.destroy('verify-membership');
                          errorHandler(error);
                        } finally {
                          setVerifyingMembership(false);
                        }
                      }}
                    >
                      {isAuthMode ? t('web.Verified') : t('web.Verify')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className={`fs-6 mb-2 text-white fw-700 ${styles.modalSubTitle}`}>
              {t('common.Screenshot Mode')}
            </div>
            <div className="mb-2">
              <div className="mb-1">
                {t('web.Alternatively You can to go to the Discord server')}{' '}
                <span className={`fw-700 ${styles.modalGuildName}`}>
                  {(guilds ?? []).find(({ id }) => id === selectedMembershipRole.guild)?.profile
                    .name ?? `[${t('web.Unknown Server')}]`}
                </span>{' '}
                {t('web.and use the slash command')}{' '}
                <span className={`text-white mx-1 fw-700 ${styles.modalCommand}`}>
                  /{selectedMembershipRole.config.aliasCommandName}
                </span>{' '}
                {t('web.to submit your membership screenshot')}.
              </div>
              <div>{t('web.Your request will be manually handled by the server moderators')}</div>
            </div>
            <div className="d-flex justify-content-center">
              <DiscordLoginButton
                className={`${styles.modalGotoServer}`}
                text={t('web.Go to Discord Server')}
                onClick={() =>
                  window.open(
                    `https://discord.com/channels/${selectedMembershipRole.guild}`,
                    '_blank',
                  )
                }
              />
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
