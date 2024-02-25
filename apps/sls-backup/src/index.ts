import AdmZip from 'adm-zip';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { AttachmentBuilder, WebhookClient } from 'discord.js';
import { exec as execCallback } from 'node:child_process';
import util from 'node:util';

import { checkAuth } from './utils/auth.js';
import { Env } from './utils/env.js';
import { logger } from './utils/logger.js';

const exec = util.promisify(execCallback);

export const backup = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  logger.debug(JSON.stringify(event, null, 2));
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  logger.info(`MongoDB backup is starting`);

  const date = new Date().toISOString();
  const fileName = 'mongodb_backup' + '_' + date.replace(/:/g, '_').replace(/\..+/, '');
  const folderName = `/tmp/${fileName}/`;

  try {
    await exec(`./mongodump --uri '${Env.MONGO_URI}' --out ${folderName}`);
  } catch (error) {
    logger.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'failed to backup' }) };
  }

  let zipBuffer: Buffer | null = null;
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(folderName);
    zipBuffer = zip.toBuffer();
  } catch (error) {
    logger.error(error);
  }
  if (zipBuffer === null) {
    return { statusCode: 500, body: JSON.stringify({ message: 'failed to zip' }) };
  }

  const client = new WebhookClient({ url: Env.DISCORD_WEBHOOK_URL });

  try {
    await client.send({
      embeds: [
        {
          title: `MongoDB Backup (${Env.NODE_ENV})`,
          timestamp: date,
        },
      ],
      files: [new AttachmentBuilder(zipBuffer, { name: `${fileName}.zip` })],
    });
  } catch (error) {
    logger.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'failed to send discord message' }) };
  }

  logger.info(`MongoDB backup is complete`);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { statusCode: 200, body: JSON.stringify({ message: 'success' }) };
};
