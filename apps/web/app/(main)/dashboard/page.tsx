'use client';

import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { ReadGuildRequest, VerifyMembershipRequest } from '@divine-bridge/common';
import message from 'antd/lib/message';
import Modal from 'antd/lib/modal';
import Spin from 'antd/lib/spin';
import Switch from 'antd/lib/switch';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { DiscordLoginButton } from 'react-social-login-buttons';

import styles from '../../../styles/Dashboard.module.css';

import GoogleOAuthButton from '../../../components/Buttons/GoogleOAuthButton';
import { MainContext } from '../../../contexts/MainContext';
import useYouTubeAuthorize from '../../../hooks/youtube';
import { publicEnv } from '../../../libs/common/public-env';
import { serverApi } from '../../../libs/common/server';

dayjs.extend(utc);

export default function Dashboard() {
  const router = useRouter();
  const { user, guilds, setGuilds } = useContext(MainContext);
  const { status } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembershipRole, setSelectedMembershipRole] = useState<
    ReadGuildRequest['res'][0]['membershipRoles'][0] | null
  >(null);

  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const [verifyingMembership, setVerifyingMembership] = useState(false);
  const [showOnlyAcquiredMemberships, setShowOnlyAcquiredMemberships] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const authorize = useYouTubeAuthorize({
    setLinkingAccount,
    messageApi,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (guilds === null) {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
        <div className="poppins mb-4 fs-5 fw-500 text-white">Loading...</div>
        <Spin className="mb-5" indicator={<LoadingOutlined className="text-white fs-2" spin />} />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <Modal
        title={<div className="text-white">Choose a Verification Mode</div>}
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
              <div className="fs-6 mb-2 text-white fw-700 poppins">OAuth Mode</div>
              <div className="mb-2">
                <div className="mb-1">
                  You can link your YouTube channel and authorize Divine Bridge to verify your
                  membership for{' '}
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
                  .
                </div>
                {user === null ||
                  (user.youtube === null && (
                    <div className="fw-500 text-white">
                      Please link your YouTube account to continue.
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
                      Your linked YouTube channel
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
                            window.open(
                              `https://www.youtube.com/${user.youtube.customUrl}`,
                              '_blank',
                            )
                          }
                        >
                          {user.youtube.title}
                        </div>
                        <div className="fs-8 text-truncate">{user.youtube.customUrl}</div>
                      </div>
                      <div
                        role="button"
                        className={`flex-shrink-0 ms-2 btn btn-success btn-sm ${
                          verifyingMembership ? 'disabled' : ''
                        }`}
                        onClick={async () => {
                          setVerifyingMembership(true);
                          void messageApi.open({
                            key: 'verify-membership',
                            type: 'loading',
                            content: 'Verifying your membership...',
                            duration: 10,
                          });
                          try {
                            const { data } = await serverApi.post<VerifyMembershipRequest>(
                              `/memberships/${selectedMembershipRole.id}`,
                              {},
                            );
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
                              content: 'Successfully verified your membership',
                            });
                            setIsModalOpen(false);
                          } catch (error) {
                            console.error(error);
                            if (axios.isAxiosError(error) && error.response !== undefined) {
                              const data = error.response.data as unknown;
                              if (
                                typeof data === 'object' &&
                                data !== null &&
                                'message' in data &&
                                typeof data.message === 'string'
                              ) {
                                void messageApi.open({
                                  key: 'verify-membership',
                                  type: 'error',
                                  content: `[Error ${error.response.status}]: ${data.message}`,
                                });
                              } else {
                                void messageApi.open({
                                  key: 'verify-membership',
                                  type: 'error',
                                  content: `[Error ${error.response.status}]: ${error.response.statusText}}`,
                                });
                              }
                            } else if (error instanceof Error) {
                              void messageApi.open({
                                key: 'verify-membership',
                                type: 'error',
                                content: `[${error.name}]: ${error.message}`,
                              });
                            } else {
                              void messageApi.open({
                                key: 'verify-membership',
                                type: 'error',
                                content: 'An unknown error has occurred',
                              });
                            }
                          } finally {
                            setTimeout(() => {
                              messageApi.destroy('verify-membership');
                            }, 3000);
                            setVerifyingMembership(false);
                          }
                        }}
                      >
                        Verify
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className={`fs-6 mb-2 text-white fw-700 ${styles.modalSubTitle}`}>OCR Mode</div>
              <div className="mb-2">
                <div className="mb-1">
                  Alternatively, You can to go to the Discord server{' '}
                  <span className={`fw-700 ${styles.modalGuildName}`}>
                    {guilds.find(({ id }) => id === selectedMembershipRole.guild)?.profile.name ??
                      '[Unknown Server]'}
                  </span>{' '}
                  and use the slash command{' '}
                  <span className={`text-white mx-1 fw-700 ${styles.modalCommand}`}>/verify</span>{' '}
                  to submit your membership screenshot.
                </div>
                <div>Your request will be manually handled by the server moderators.</div>
              </div>
              <div className="d-flex justify-content-center">
                <DiscordLoginButton
                  className={`${styles.modalGotoServer}`}
                  text="Go to Discord Server"
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
      <div className="my-5">
        <div className={`container ${styles.container}`}>
          <div className="row pt-4 mb-2">
            <div className="fs-5 ms-2 poppins fw-700 text-white">
              Membership Roles in your servers
            </div>
          </div>
          <div className="row mb-3">
            <div className="d-flex align-items-center">
              <div className="mx-2 text-white fs-7">Show only acquired memberships</div>
              <Switch
                className="flex-shrink-0"
                checked={showOnlyAcquiredMemberships}
                size="small"
                onChange={() => setShowOnlyAcquiredMemberships((show) => !show)}
              />
            </div>
          </div>
          <div className="row">
            {guilds
              .filter((guild) =>
                showOnlyAcquiredMemberships
                  ? guild.membershipRoles.some(({ membership }) => membership !== null)
                  : true,
              )
              .map((guild) => {
                return (
                  <div key={guild.id} className="my-2">
                    <div className={styles.card}>
                      <div className="mb-4 mx-2 d-flex justify-content-between align-items-center">
                        <div
                          role="button"
                          className={`flex-grow-1 d-flex align-items-center ${styles.cardHeader}`}
                          onClick={() =>
                            window.open(`https://discord.com/channels/${guild.id}`, '_blank')
                          }
                        >
                          {guild.profile.icon !== null && (
                            <Image
                              className="flex-shrink-0 rounded-circle"
                              src={guild.profile.icon}
                              alt={`${guild.profile.name}'s icon`}
                              width={40}
                              height={40}
                            />
                          )}
                          <div className="flex-grow-1 text-truncate fw-700 fs-4 mx-3">
                            {guild.profile.name}
                          </div>
                        </div>
                        <div
                          className={`flex-shrink-0 fw-600 ${styles.membershipRoleCount}`}
                        >{`Roles: ${guild.membershipRoles.length}`}</div>
                      </div>
                      <div className={`pb-1 d-flex overflow-auto ${styles.cardBody}`}>
                        {guild.membershipRoles
                          .filter(({ membership }) =>
                            showOnlyAcquiredMemberships ? membership !== null : true,
                          )
                          .map((membershipRole) => {
                            return (
                              <div
                                key={membershipRole.id}
                                className={`flex-shrink-0 mx-2 p-3 ${styles.membershipRole} ${
                                  membershipRole.membership !== null
                                    ? styles.verifiedMembershipRole
                                    : ''
                                } d-flex flex-column`}
                              >
                                <div className="flex-shrink-0 mb-3 d-flex">
                                  <Image
                                    className="flex-shrink-0 rounded-circle"
                                    src={membershipRole.youtube.profile.thumbnail}
                                    alt={`${guild.profile.name}'s icon`}
                                    width={64}
                                    height={64}
                                  />
                                  <div className={`flex-grow-1 ps-3 ${styles.channelInfo}`}>
                                    <div className="d-flex align-items-center">
                                      {membershipRole.membership !== null && (
                                        <CheckCircleOutlined
                                          className={`fs-5 me-2 ${styles.checked}`}
                                        />
                                      )}
                                      <div
                                        role="button"
                                        className={`fs-5 text-truncate ${styles.channelTitle}`}
                                        onClick={() =>
                                          window.open(
                                            `https://www.youtube.com/${membershipRole.youtube.profile.customUrl}`,
                                            '_blank',
                                          )
                                        }
                                      >
                                        {membershipRole.youtube.profile.title}
                                      </div>
                                    </div>
                                    <div>{membershipRole.youtube.profile.customUrl}</div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 mb-1 d-flex align-items-center">
                                  Membership Role:
                                  <div
                                    className={`ms-2 fw-500 ${styles.membershipRolePill}`}
                                    onMouseEnter={() => setHoveredRoleId(membershipRole.id)}
                                    onMouseLeave={() => setHoveredRoleId(null)}
                                    style={{
                                      color: `#${
                                        membershipRole.profile.color === 0
                                          ? 'c9cdfb'
                                          : membershipRole.profile.color
                                              .toString(16)
                                              .padStart(6, '0')
                                      }`,
                                      backgroundColor: `#${
                                        membershipRole.profile.color === 0
                                          ? '5865f24c'
                                          : membershipRole.profile.color
                                              .toString(16)
                                              .padStart(6, '0') +
                                            (membershipRole.id === hoveredRoleId ? '4D' : '1A')
                                      }`,
                                    }}
                                  >
                                    @{membershipRole.profile.name}
                                  </div>
                                </div>
                                {membershipRole.membership === null ? (
                                  <div className="flex-grow-1 d-flex align-items-end">
                                    <div
                                      role="button"
                                      className={`rounded-1 btn-custom ${styles.verify}`}
                                      onClick={() => {
                                        setSelectedMembershipRole(membershipRole);
                                        setIsModalOpen(true);
                                      }}
                                    >
                                      Apply
                                    </div>
                                  </div>
                                ) : membershipRole.membership.type === 'auth' ? (
                                  <>
                                    <div className="flex-shrink-0 mb-1">
                                      Verification Mode: OAuth
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="flex-shrink-0 mb-1">Verification Mode: OCR</div>
                                    <div className="flex-shrink-0">
                                      Next Billing Date:{' '}
                                      <span className={`fw-700 ${styles.billingDate}`}>
                                        {dayjs
                                          .utc(membershipRole.membership.end)
                                          .format('YYYY-MM-DD')}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })}
            <div className="my-2">
              <div
                role="button"
                className={`d-flex justify-content-center align-items-center ${styles.cardPlaceholder}`}
                onClick={() => {
                  const url = new URL('https://discord.com/api/oauth2/authorize');
                  url.searchParams.set('client_id', publicEnv.NEXT_PUBLIC_DISCORD_CLIENT_ID);
                  url.searchParams.set('permissions', PermissionFlagsBits.ManageRoles.toString());
                  url.searchParams.set('scope', 'applications.commands bot');
                  window.location.href = url.toString();
                }}
              >
                <div className="poppins fs-5 user-select-none">
                  + Invite Divine Bridge bot to a new server
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
