import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import Collapse from 'antd/es/collapse';
import Modal from 'antd/es/modal/Modal';
import Spin from 'antd/es/spin';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import { Dispatch, SetStateAction, useContext, useState } from 'react';

import styles from './SettingsModal.module.css';

import { MainContext } from '../../contexts/MainContext';
import { useErrorHandler } from '../../hooks/error-handler';
import useYouTubeAuthorize from '../../hooks/youtube';
import { requiredAction } from '../../libs/common/action';
import { deleteAccountAction } from '../../libs/server/actions/delete-account';
import { revokeYouTubeAction } from '../../libs/server/actions/revoke-youtube';
import GoogleOAuthButton from '../Buttons/GoogleOAuthButton';

export default function SettingsModal({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { user, messageApi } = useContext(MainContext);

  const [linkingAccount, setLinkingAccount] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [action, setAction] = useState<'revoke' | 'delete' | null>(null);

  const errorHandler = useErrorHandler(messageApi);

  const authorize = useYouTubeAuthorize({
    setLinkingAccount,
    messageApi,
  });

  const handleRevokeOAuthAuthorization = async () => {
    try {
      void messageApi.loading('Revoking your YouTube OAuth Authorization...');
      await revokeYouTubeAction({}).then(requiredAction);
      window.location.reload();
    } catch (error) {
      errorHandler(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      void messageApi.open({
        key: 'delete-account',
        type: 'loading',
        content: 'Deleting your account...',
        duration: 60,
      });
      await deleteAccountAction({}).then(requiredAction);
      messageApi.destroy('delete-account');
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      messageApi.destroy('delete-account');
      errorHandler(error);
    }
  };

  return (
    <>
      <Modal
        className={styles.modal}
        title={<div className="text-white">Settings</div>}
        open={isModalOpen}
        footer={null}
        centered
        onCancel={() => setIsModalOpen(false)}
      >
        <div className="fs-6 mt-3 mb-2 text-white fw-700 poppins">Discord Account</div>
        {user !== null && (
          <div className="mb-4">
            <div className={`px-3 py-2 rounded d-flex align-items-center ${styles.accountWrapper}`}>
              <div className="flex-grow-1 d-flex align-items-center">
                <Image
                  className="flex-shrink-0 rounded-circle"
                  src={user.profile.image}
                  alt={`${user.profile.username}'s icon`}
                  width={56}
                  height={56}
                />
                <div className="ms-3 fs-5 text-white">{user.profile.username}</div>
              </div>
              <div
                role="button"
                className="btn btn-success btn-sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </div>
            </div>
          </div>
        )}
        <div className="fs-6 mt-3 mb-2 text-white fw-700 poppins">Linked YouTube Account</div>
        {linkingAccount ? (
          <div className={`d-flex justify-content-center ${styles.loadingBox}`}>
            <Spin indicator={<LoadingOutlined className="text-white fs-4" spin />} />
          </div>
        ) : (
          <>
            {user === null || user.youtube === null ? (
              <>
                <div className="mb-2 fw-500">You have not linked your YouTube account yet.</div>
                <div className="my-3 d-flex justify-content-center">
                  <GoogleOAuthButton className="flex-grow-1" onClick={() => authorize()} />
                </div>
                <div className={`position-relative ${styles.youtubeBranding}`}>
                  <Image
                    className="object-fit-contain"
                    src="/developed-with-youtube-sentence-case-light.png"
                    alt="developed with YouTube"
                    fill
                  />
                </div>
              </>
            ) : (
              <div className="mb-4">
                <div className={`px-3 py-2 rounded d-flex ${styles.accountWrapper}`}>
                  <Image
                    className="flex-shrink-0 rounded-circle"
                    src={user.youtube.thumbnail}
                    alt={`${user.youtube.title}'s icon`}
                    width={56}
                    height={56}
                  />
                  <div className={`flex-grow-1 ps-3 ${styles.accountInfo}`}>
                    <div
                      role="button"
                      className={`fs-5 text-truncate fw-500 ${styles.accountTitle}`}
                      onClick={() =>
                        user.youtube !== null &&
                        window.open(`https://www.youtube.com/${user.youtube.customUrl}`, '_blank')
                      }
                    >
                      {user.youtube.title}
                    </div>
                    <div className="fs-7 text-truncate">{user.youtube.customUrl}</div>
                  </div>
                </div>
              </div>
            )}
            <Collapse bordered={false} className={styles.collapse}>
              <Collapse.Panel header="Advanced" key="advanced">
                {user !== null && user.youtube !== null && (
                  <>
                    <div className="mb-2">
                      If you don&apos;t want to use Auth Mode anymore, you can{' '}
                      <span className="text-danger fw-700">Revoke OAuth Authorization</span> from
                      Divine Bridge. We will remove your{' '}
                      <span className="text-warning fw-500">linked YouTube account</span> and{' '}
                      <span className="text-warning fw-500">membership roles under Auth mode</span>{' '}
                      you acquired.
                    </div>
                    <div className="mt-3 mb-4 d-flex justify-content-center">
                      <div
                        role="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setAction('revoke');
                          setIsConfirmModalOpen(true);
                        }}
                      >
                        Revoke OAuth Authorization
                      </div>
                    </div>
                  </>
                )}
                <div className="mb-2">
                  If you don&apos;t want to use Divine Bridge anymore, you can{' '}
                  <span className="text-danger fw-700">Delete Your Account</span>. We will remove{' '}
                  <span className="text-warning fw-500">all your data</span> in our database and{' '}
                  <span className="text-warning fw-500">every membership role</span> you acquired.
                </div>
                <div className="mt-3 d-flex justify-content-center">
                  <div
                    role="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setAction('delete');
                      setIsConfirmModalOpen(true);
                    }}
                  >
                    Delete Your Account
                  </div>
                </div>
              </Collapse.Panel>
            </Collapse>
          </>
        )}
      </Modal>
      <Modal
        className={styles.modal}
        title={<div className="fs-5 text-warning">Warning</div>}
        open={isConfirmModalOpen}
        footer={null}
        centered
        classNames={{
          body: 'fw-700 fs-6',
        }}
        onCancel={() => setIsConfirmModalOpen(false)}
      >
        <div>
          Are your sure you want to{' '}
          <span className="text-danger">
            {action === 'revoke' ? 'Revoke OAuth Authorization' : 'Delete Your Account'}
          </span>
          ?
        </div>
        <div className="mb-3">This action cannot be undone.</div>
        <div className="d-flex justify-content-end">
          <div
            role="button"
            className="btn btn-danger btn-sm"
            onClick={async () => {
              if (action === 'revoke') {
                await handleRevokeOAuthAuthorization();
              } else if (action === 'delete') {
                await handleDeleteAccount();
              }
            }}
          >
            Confirm
          </div>
        </div>
      </Modal>
    </>
  );
}
