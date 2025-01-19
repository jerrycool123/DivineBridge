import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { Env } from './env.js';

export const checkAuth = (event: APIGatewayProxyEventV2) => {
  console.log(JSON.stringify(event, null, 2));
  return event.headers['authorization'] === `Bearer ${Env.API_TOKEN}`;
};
