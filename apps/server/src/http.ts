import http from 'node:http';
import { AddressInfo } from 'node:net';

import { logger } from './utils/logger.js';

export const httpServer = http.createServer();

httpServer.on('request', (req, res) => {
  res.writeHead(req.url === '/heartbeat' ? 204 : 404).end();
});

httpServer.on('listening', () => {
  logger.debug(
    `Server is listening on port ${(httpServer.address() as AddressInfo).port.toString()}`,
  );
});

httpServer.on('close', () => {
  logger.debug('Server is closed');
});
