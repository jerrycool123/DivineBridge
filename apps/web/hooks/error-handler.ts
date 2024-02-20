import 'client-only';
import { useCallback, useContext } from 'react';

import { MainContext } from '../contexts/MainContext';

export const useErrorHandler = () => {
  const { messageApi } = useContext(MainContext);

  return useCallback(
    (error: unknown) => {
      console.error(error);
      if (error instanceof Error) {
        void messageApi.error(`[${error.name}]: ${error.message}`);
      } else {
        void messageApi.error('An unknown error has occurred');
      }
    },
    [messageApi],
  );
};
