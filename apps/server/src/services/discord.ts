import { Queue } from '../utils/queue.js';

export namespace DiscordService {
  export const apiQueue = new Queue('Discord API', {
    autoStart: true,
    intervalCap: 1,
    interval: 100,
  });
}
