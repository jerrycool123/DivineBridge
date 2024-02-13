'use client';

import { ReadCurrentUserRequest, ReadGuildRequest } from '@divine-bridge/common';
import message from 'antd/es/message';
import { MessageInstance } from 'antd/es/message/interface';
import { isAxiosError } from 'axios';
import { useSession } from 'next-auth/react';
import { Dispatch, ReactNode, SetStateAction, createContext, useEffect, useState } from 'react';

import { errorDataSchema } from '../libs/common/error';
import { serverApi } from '../libs/common/server';

export interface TMainContext {
  user: ReadCurrentUserRequest['res'] | null;
  setUser: Dispatch<SetStateAction<ReadCurrentUserRequest['res'] | null>>;
  guilds: ReadGuildRequest['res'] | null;
  setGuilds: Dispatch<SetStateAction<ReadGuildRequest['res'] | null>>;
  messageApi: MessageInstance;
}

export const MainContext = createContext<TMainContext>({
  user: null,
  setUser: () => undefined,
  guilds: null,
  setGuilds: () => undefined,
  messageApi: undefined as unknown as MessageInstance,
});

export const MainProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession();
  const [messageApi, contextHolder] = message.useMessage();
  const [user, setUser] = useState<TMainContext['user']>(null);
  const [guilds, setGuilds] = useState<ReadGuildRequest['res'] | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void (async () => {
      try {
        const { data } = await serverApi.get<ReadCurrentUserRequest>('/users/@me');
        setUser(data);
      } catch (error) {
        if (isAxiosError(error) && error.response !== undefined) {
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
      }
    })();
    void (async () => {
      try {
        const { data } = await serverApi.get<ReadGuildRequest>('/guilds');
        setGuilds(data);
      } catch (error) {
        if (isAxiosError(error) && error.response !== undefined) {
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
      }
    })();
  }, [messageApi, status]);

  return (
    <MainContext.Provider value={{ user, setUser, guilds, setGuilds, messageApi }}>
      {contextHolder}
      {children}
    </MainContext.Provider>
  );
};
