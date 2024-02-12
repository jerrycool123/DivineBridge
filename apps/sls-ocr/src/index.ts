import express from 'express';
import serverless from 'serverless-http';
import { createWorker } from 'tesseract.js';

import { authMiddleware } from './middleware.js';
import { ocrBodySchema } from './utils/schemas.js';

const app = express();
app.use(express.json());

app.use((req, _res, next) => {
  console.log(req.method, req.url);
  next();
});

app.use(authMiddleware);

app.post('/api/ocr', async (req, res) => {
  const parsedBody = ocrBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({ message: parsedBody.error });
  }
  const { image, language } = parsedBody.data;

  const worker = await createWorker(language, 1, {
    workerPath: './node_modules/tesseract.js/src/worker-script/node/index.js',
    cachePath: '/tmp',
  });
  const ret = await worker.recognize(image);
  await worker.terminate();

  res.status(200).json({ message: ret.data.text });
});

app.all('*', (_req, res) => {
  res.status(404).end();
});

export const handler = serverless(app);
