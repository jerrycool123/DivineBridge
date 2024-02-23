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
        error: unknown;
      }
  > {
    return await this.queue.add(
      async () => {
        try {
          const value = await cb();
          return { success: true, value };
        } catch (error) {
          return { success: false, error };
        }
      },
      {
        throwOnTimeout: true,
      },
    );
  }
}
