import type { NextFunction, Request, Response } from 'express';

import { Env } from './utils/env.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers['authorization'] !== `Bearer ${Env.API_TOKEN}`) {
    return res.status(401).end();
  }

  next();
};
