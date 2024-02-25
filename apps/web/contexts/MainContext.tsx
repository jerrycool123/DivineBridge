'use client';

import message from 'antd/es/message';
import { MessageInstance } from 'antd/es/message/interface';
import { useSession } from 'next-auth/react';
import { Dispatch, ReactNode, SetStateAction, createContext, useEffect, useState } from 'react';

import { useErrorHandler } from '../hooks/error-handler';
import { requiredAction } from '../libs/common/action';
import { getGuildsAction } from '../libs/server/actions/get-guilds';
import { getUserAction } from '../libs/server/actions/get-user';
import type { GetGuildsActionData, GetUserActionData } from '../types/server-actions';

export interface TMainContext {
  user: GetUserActionData | null;
  setUser: Dispatch<SetStateAction<GetUserActionData | null>>;
  guilds: GetGuildsActionData | null;
  setGuilds: Dispatch<SetStateAction<GetGuildsActionData | null>>;
  messageApi: MessageInstance;
  errorHandler: (error: unknown) => void;
}

export const MainContext = createContext<TMainContext>({
  user: null,
  setUser: () => undefined,
  guilds: null,
  setGuilds: () => undefined,
  messageApi: undefined as unknown as MessageInstance,
  errorHandler: () => undefined,
});

export const MainProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [user, setUser] = useState<TMainContext['user']>(null);
  const [guilds, setGuilds] = useState<TMainContext['guilds'] | null>(null);

  const errorHandler = useErrorHandler(messageApi);

  useEffect(() => {
    if (status !== 'authenticated') return;

    void getUserAction({})
      .then(requiredAction)
      .then(({ data }) => setUser(data))
      .catch(errorHandler);
    void getGuildsAction({})
      .then(requiredAction)
      .then(({ data }) => setGuilds(data))
      .catch(errorHandler);
  }, [errorHandler, messageApi, status]);

  return (
    <MainContext.Provider value={{ user, setUser, guilds, setGuilds, messageApi, errorHandler }}>
      {contextHolder}
      {children}
    </MainContext.Provider>
  );
};
