import { Logger } from '@divine-bridge/common';
import { Server } from 'node:http';

export const registerProcessHandlers = (logger: Logger, httpServer: Server) => {
  let cleanup = false;
  const stopHandler = () => {
    if (cleanup) return;
    cleanup = true;
    httpServer.close();
    logger.info(`Logged out and exited.`);
  };

  process.on('unhandledRejection', async (reason: string, p: Promise<unknown>) => {
    logger.fatal(`Unhandled Rejection at: ${p as unknown as string} reason:', ${reason}`);
    stopHandler();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(1);
  });
  process.on('uncaughtException', async (error: Error) => {
    logger.fatal(`Uncaught Exception: ${error.message}`);
    stopHandler();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.exit(1);
  });
  process.on('exit', stopHandler);

  logger.debug('Process handlers registered');
};
