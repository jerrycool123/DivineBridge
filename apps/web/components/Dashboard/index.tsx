'use client';

import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Spin from 'antd/es/spin';
import Switch from 'antd/es/switch';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';

import styles from './Dashboard.module.css';

import ApplyModal from '../../components/Modals/ApplyModal';
import { MainContext } from '../../contexts/MainContext';
import { useClientTranslation } from '../../libs/client/i18n';
import { getDiscordBotInviteLink } from '../../libs/common/discord';
import { GetGuildsActionData } from '../../types/server-actions';

dayjs.extend(utc);

export default function Dashboard({ lng }: { lng: string | string[] | undefined }) {
  const { guilds } = useContext(MainContext);
  const { t } = useClientTranslation(lng);

  const [redirectTriggered, setRedirectTriggered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMembershipRole, setSelectedMembershipRole] = useState<
    GetGuildsActionData[number]['membershipRoles'][number] | null
  >(null);

  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [viewAcquiredMembershipsOnly, setViewAcquiredMembershipsOnly] = useState(false);

  useEffect(() => {
    if (guilds === null || redirectTriggered) return;

    const url = new URL(window.location.href);
    const roleId = url.searchParams.get('roleId');
    if (roleId === null) return;

    setRedirectTriggered(true);
    for (const guild of guilds) {
      for (const membershipRole of guild.membershipRoles) {
        if (membershipRole.id === roleId) {
          setSelectedMembershipRole(membershipRole);
          setIsModalOpen(true);
          break;
        }
      }
    }
  }, [guilds, redirectTriggered]);

  if (guilds === null) {
    return (
      <div className="vh-100 d-flex flex-column justify-content-center align-items-center">
        <div className="poppins mb-4 fs-5 fw-500 text-white">{t('web.Loading')}...</div>
        <Spin className="mb-5" indicator={<LoadingOutlined className="text-white fs-2" spin />} />
      </div>
    );
  }

  return (
    <>
      <ApplyModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        selectedMembershipRole={selectedMembershipRole}
        setSelectedMembershipRole={setSelectedMembershipRole}
      />
      <div className="my-5">
        <div className={`container ${styles.container}`}>
          <div className="row pt-4 mb-2">
            <div className="fs-5 ms-2 poppins fw-700 text-white">
              {t('web.Membership Roles in your servers')}
            </div>
          </div>
          <div className="row mb-3">
            <div className="d-flex align-items-center">
              <div className="mx-2 text-white fs-7">{t('web.View acquired memberships only')}</div>
              <Switch
                className="flex-shrink-0"
                checked={viewAcquiredMembershipsOnly}
                size="small"
                onChange={() => {
                  setViewAcquiredMembershipsOnly((show) => !show);
                }}
              />
            </div>
          </div>
          <div className="row">
            {guilds
              .filter((guild) =>
                viewAcquiredMembershipsOnly
                  ? guild.membershipRoles.some(({ membership }) => membership !== null)
                  : true,
              )
              .map((guild) => {
                return (
                  <div key={guild.id} className="my-2">
                    <div className={styles.card}>
                      <div className="mb-4 mx-2 d-flex justify-content-between align-items-center">
                        <div
                          className={`flex-grow-1 d-flex align-items-center ${styles.cardHeader}`}
                        >
                          <div
                            role="button"
                            className={`d-flex align-items-center ${styles.guildButton}`}
                            style={{ minWidth: 0 }}
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
                        </div>
                        <div
                          className={`flex-shrink-0 fw-600 ${styles.membershipRoleCount}`}
                        >{`${t('web.Membership Roles')} ${guild.membershipRoles.length.toString()}`}</div>
                      </div>
                      <div className={`pb-1 d-flex overflow-auto ${styles.cardBody}`}>
                        {guild.membershipRoles
                          .filter(({ membership }) =>
                            viewAcquiredMembershipsOnly ? membership !== null : true,
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
                                          color="#52c41a"
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
                                  <span className={styles.fieldName}>
                                    {t('web.Membership Role')}
                                  </span>
                                  <div
                                    className={`fw-500 ${styles.membershipRolePill}`}
                                    onMouseEnter={() => {
                                      setHoveredRoleId(membershipRole.id);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredRoleId(null);
                                    }}
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
                                      {t('web.Apply')}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-shrink-0 mb-1">
                                      <span className={styles.fieldName}>
                                        {t('web.Verification Mode')}
                                      </span>
                                      <span className="text-white fw-500">
                                        {membershipRole.membership.type === 'auth'
                                          ? t('common.Auth Mode')
                                          : membershipRole.membership.type === 'manual' ||
                                              membershipRole.membership.type === 'screenshot'
                                            ? t('common.Screenshot Mode')
                                            : t('web.Live Chat Mode')}
                                      </span>
                                    </div>
                                    <div className="flex-shrink-0">
                                      <span className={styles.fieldName}>
                                        {t('web.Membership Duration')}
                                      </span>
                                      <span className={`fw-500 ${styles.date}`}>
                                        {dayjs
                                          .utc(membershipRole.membership.begin)
                                          .format('YYYY-MM-DD')}
                                        {' ~ '}
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
              >
                <div className="poppins fs-5 user-select-none">
                  + {t('web.Invite Divine Bridge bot to a new server')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
