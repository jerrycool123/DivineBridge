import { GuildDoc } from '@divine-bridge/common';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10';
import { WebhookClient } from 'discord.js';

import { DiscordAPI } from './discord.js';
import { Env } from './env.js';

export namespace Logger {
  const client = new WebhookClient({
    url: Env.DISCORD_LOG_WEBHOOK_URL,
  });

  export const awsEventLog = (event: APIGatewayProxyEventV2) => {
    console.log(JSON.stringify(event, null, 2));
  };

  export const sysLog = async (
    message: string,
    from: 'check-screenshot-membership' | 'check-auth-membership',
  ) => {
    try {
      console.error(message);
      await client.send({
        content: `[${from}][${new Date().toISOString()}]\n` + message,
      });
    } catch (error) {
      console.error('Failed to log error to Discord');
      console.error(error);
    }
  };

  export const guildLog = async (
    guildDoc: GuildDoc,
    message: RESTPostAPIChannelMessageJSONBody,
  ) => {
    const { logChannel: logCHannelId } = guildDoc.config;
    const guildName = guildDoc.profile.name;
    const guildId = guildDoc._id;

    // Send to log channel
    if (logCHannelId !== null) {
      const logChannel = await DiscordAPI.fetchChannel(logCHannelId);
      if (logChannel !== null) {
        const result = await DiscordAPI.createChannelMessage(logCHannelId, message);
        if (result !== null) {
          return;
        }
      }
    }

    // If failed, send to owner
    const guild = await DiscordAPI.fetchGuild(guildId);
    if (guild !== null) {
      const ownerId = guild.owner_id;
      const result = await DiscordAPI.createDMMessage(ownerId, {
        ...message,
        content:
          `> I cannot send event log to the log channel in your server \`${guildDoc.profile.name}\`.\n` +
          `> Please make sure that the log channel is set with \`/set-log-channel\`, and that I have enough permissions to send messages in it.\n\n` +
          (message.content ?? ''),
      });
      if (result !== null) {
        return;
      }
    }

    // If failed, send to system log
    await Logger.sysLog(
      `Failed to deliver event log to the guild ${guildName} (ID: ${guildId}).\n\n` +
        (message.content ?? ''),
      'check-screenshot-membership',
    );
  };
}
