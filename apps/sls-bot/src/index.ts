/* eslint-disable turbo/no-undeclared-env-vars */
import {
  APIInteraction,
  APIInteractionResponsePong,
  InteractionResponseType,
  InteractionType,
} from 'discord-api-types/v10';
import { verifyKey } from 'discord-interactions';
import express from 'express';
import serverless from 'serverless-http';

import { applicationCommandHandler } from './application-commands/index.js';
import { Env } from './utils/env.js';
import { registerGlobalCommands } from './utils/register.js';

const app = express();

app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

app.post('/api/register-global-commands', async (req, res) => {
  const token = req.get('Authorization');
  if (token !== `Bearer ${Env.API_TOKEN}`) {
    return res.status(401).end();
  }
  const result = await registerGlobalCommands();
  return res.status(200).json({ success: result });
});

app.post('/api/interactions', async (req, res) => {
  const signature = req.get('X-Signature-Ed25519') ?? '';
  const timestamp = req.get('X-Signature-Timestamp') ?? '';
  const body = Buffer.from(req.body as Buffer).toString('utf-8');
  const isValidRequest = verifyKey(body, signature, timestamp, Env.DISCORD_CLIENT_PUBLIC_KEY);
  console.log(body);
  if (!isValidRequest) {
    console.error('Invalid request');
    return res.status(401).end();
  }
  const message = JSON.parse(body) as APIInteraction;
  if (message.type === InteractionType.Ping) {
    const resBody: APIInteractionResponsePong = {
      type: InteractionResponseType.Pong,
    };
    return res.json(resBody);
  } else if (message.type === InteractionType.ApplicationCommand) {
    const resBody = await applicationCommandHandler(message);
    return res.json(resBody);
  }
});

app.all('*', (_req, res) => {
  res.status(404).end();
});

export const handler = serverless(app);
