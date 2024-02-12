import { container } from '@sapphire/framework';
import PQueue, { Options } from 'p-queue';

export class Queue {
  private readonly queue: PQueue;

  constructor(
    public readonly name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: Options<any, any>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.queue = new PQueue(options);
  }

  async add<T>(cb: () => Promise<T>): Promise<
    | {
        success: true;
        value: T;
      }
    | {
        success: false;
      }
  > {
    return await this.queue.add(
      async () => {
        try {
          const value = await cb();
          return {
            success: true,
            value,
          };
        } catch (error) {
          container.logger.error(`An error occurred while executing a ${this.name} job:`);
          container.logger.error(error);
        }
        return {
          success: false,
        };
      },
      {
        throwOnTimeout: true,
      },
    );
  }
}
