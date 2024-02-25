import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { createWorker } from 'tesseract.js';

import { checkAuth } from './utils/auth.js';
import { logger } from './utils/logger.js';
import { ocrBodySchema } from './utils/schemas.js';

export const ocr = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  logger.debug(JSON.stringify(event, null, 2));
  if (!checkAuth(event)) {
    return { statusCode: 403 };
  }

  const parsedBody = ocrBodySchema.safeParse(JSON.parse(event.body ?? ''));
  if (!parsedBody.success) {
    return { statusCode: 400, body: JSON.stringify({ message: parsedBody.error }) };
  }
  const { image, language } = parsedBody.data;

  const worker = await createWorker(language, 1, {
    workerPath: './node_modules/tesseract.js/src/worker-script/node/index.js',
    cachePath: '/tmp',
  });
  const ret = await worker.recognize(image);
  await worker.terminate();

  return { statusCode: 200, body: JSON.stringify({ message: ret.data.text }) };
};
