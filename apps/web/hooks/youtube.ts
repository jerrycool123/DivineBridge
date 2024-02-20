import { useGoogleLogin } from '@react-oauth/google';
import { MessageInstance } from 'antd/es/message/interface';
import 'client-only';
import { Dispatch, SetStateAction, useContext } from 'react';

import { MainContext } from '../contexts/MainContext';
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
  const { setUser } = useContext(MainContext);

  const errorHandler = useErrorHandler();

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
        void messageApi.success('Successfully linked your YouTube channel');
      } catch (error) {
        errorHandler(error);
      } finally {
        setLinkingAccount(false);
      }
    },
    onError: ({ error, error_description }) => {
      console.error(error);
      void messageApi.error(`${error ?? ''}: ${error_description ?? '[Unknown Error]'}`);
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/youtube.force-ssl',
    select_account: true,
  });
};

export default useYouTubeAuthorize;
