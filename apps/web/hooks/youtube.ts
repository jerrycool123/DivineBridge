import { useGoogleLogin } from '@react-oauth/google';
import { MessageInstance } from 'antd/es/message/interface';
import 'client-only';
import { useParams } from 'next/navigation';
import { Dispatch, SetStateAction, useContext } from 'react';

import { MainContext } from '../contexts/MainContext';
import { useClientTranslation } from '../libs/client/i18n';
import { requiredAction } from '../libs/common/action';
import { connectYouTubeAction } from '../libs/server/actions/connect-youtube';
import { useErrorHandler } from './error-handler';

const useYouTubeAuthorize = ({
  setLinkingAccount,
  messageApi,
}: {
  setLinkingAccount: Dispatch<SetStateAction<boolean>>;
  messageApi: MessageInstance;
}) => {
  const { lng } = useParams();
  const { t } = useClientTranslation(lng);
  const { setUser } = useContext(MainContext);

  const errorHandler = useErrorHandler(messageApi);

  return useGoogleLogin({
    onSuccess: async ({ code }) => {
      setLinkingAccount(true);
      try {
        const data = await connectYouTubeAction({ code })
          .then(requiredAction)
          .then(({ data }) => data);
        setUser((oldUser) =>
          oldUser !== null
            ? {
                ...oldUser,
                youtube: data,
              }
            : null,
        );
        void messageApi.success(t('web.Successfully linked your YouTube account'));
      } catch (error) {
        errorHandler(error);
      } finally {
        setLinkingAccount(false);
      }
    },
    onError: ({ error, error_description }) => {
      console.error(error);
      void messageApi.error(
        `${error ?? ''}: ${error_description ?? `[${t('web.Unknown Error')}]`}`,
      );
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
    select_account: true,
  });
};

export default useYouTubeAuthorize;
