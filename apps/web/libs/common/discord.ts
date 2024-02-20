import { PermissionFlagsBits, RouteBases, Routes } from 'discord-api-types/v10';

import { publicEnv } from './public-env';

export const getDiscordBotInviteLink = () => {
  const url = new URL(`${RouteBases.api}${Routes.oauth2Authorization()}`);
  url.searchParams.set('client_id', publicEnv.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  url.searchParams.set('permissions', PermissionFlagsBits.ManageRoles.toString());
  url.searchParams.set('scope', 'applications.commands bot');
  return url.toString();
};
