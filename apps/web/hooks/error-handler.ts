'use client';

import { MessageInstance } from 'antd/es/message/interface';
import 'client-only';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';

import { useClientTranslation } from '../libs/client/i18n';

export const useErrorHandler = (messageApi: MessageInstance) => {
  const { lng } = useParams();
  const { t } = useClientTranslation(lng);

  const unknown_error = t('web.An unknown error has occurred');

  return useCallback(
    (error: unknown) => {
      console.error(error);
      if (error instanceof Error) {
        void messageApi.error(`[${error.name}]: ${error.message}`);
      } else {
        void messageApi.error(unknown_error);
      }
    },
    [messageApi, unknown_error],
  );
};
