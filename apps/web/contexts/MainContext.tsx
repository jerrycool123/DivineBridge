'use client';

import { ReadCurrentUserRequest, ReadGuildRequest } from '@divine-bridge/common';
import { useSession } from 'next-auth/react';
import { Dispatch, ReactNode, SetStateAction, createContext, useEffect, useState } from 'react';

import { serverApi } from '../libs/common/server';

export interface TMainContext {
  user: ReadCurrentUserRequest['res'] | null;
  setUser: Dispatch<SetStateAction<ReadCurrentUserRequest['res'] | null>>;
  guilds: ReadGuildRequest['res'] | null;
  setGuilds: Dispatch<SetStateAction<ReadGuildRequest['res'] | null>>;
}

export const MainContext = createContext<TMainContext>({
  user: null,
  setUser: () => undefined,
  guilds: null,
  setGuilds: () => undefined,
});

export const MainProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession();
  const [user, setUser] = useState<TMainContext['user']>(null);
  const [guilds, setGuilds] = useState<ReadGuildRequest['res'] | null>(null);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      const { data } = await serverApi.get<ReadCurrentUserRequest>('/users/@me');
      setUser(data);
    })().catch(console.error);
    (async () => {
      const { data } = await serverApi.get<ReadGuildRequest>('/guilds');
      setGuilds(data);
    })().catch(console.error);
  }, [status]);

  return (
    <MainContext.Provider value={{ user, setUser, guilds, setGuilds }}>
      {children}
    </MainContext.Provider>
  );
};
