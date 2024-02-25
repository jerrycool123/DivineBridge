import { MessageInstance } from 'antd/es/message/interface';
import 'client-only';
import { useCallback } from 'react';

export const useErrorHandler = (messageApi: MessageInstance) => {
  return useCallback(
    (error: unknown) => {
      console.error(error);
      if (error instanceof Error) {
        void messageApi?.error(`[${error.name}]: ${error.message}`);
      } else {
        void messageApi?.error('An unknown error has occurred');
      }
    },
    [messageApi],
  );
};
