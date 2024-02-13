import { GoogleAuthRequest } from '@divine-bridge/common';
import { useGoogleLogin } from '@react-oauth/google';
import { MessageInstance } from 'antd/es/message/interface';
import axios from 'axios';
import { Dispatch, SetStateAction, useContext } from 'react';

import { MainContext } from '../contexts/MainContext';
import { errorDataSchema } from '../libs/common/error';
import { serverApi } from '../libs/common/server';

const useYouTubeAuthorize = ({
  setLinkingAccount,
  messageApi,
}: {
  setLinkingAccount: Dispatch<SetStateAction<boolean>>;
  messageApi: MessageInstance;
}) => {
  const { setUser } = useContext(MainContext);

  return useGoogleLogin({
    onSuccess: async ({ code }) => {
      setLinkingAccount(true);
      try {
        const { data } = await serverApi.post<GoogleAuthRequest>('/auth/google', { code });
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
        console.error(error);
        if (axios.isAxiosError(error) && error.response !== undefined) {
          const parsedData = errorDataSchema.safeParse(error.response.data);
          if (parsedData.success) {
            const { message } = parsedData.data;
            void messageApi.error(`[${error.response.status}]: ${message}`);
          } else {
            void messageApi.error(`[${error.response.status}]: ${error.response.statusText}}`);
          }
        } else if (error instanceof Error) {
          void messageApi.error(`[${error.name}]: ${error.message}`);
        } else {
          void messageApi.error('An unknown error has occurred');
        }
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
