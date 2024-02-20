import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { WebhookClient } from 'discord.js';

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
}
