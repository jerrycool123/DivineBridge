/* eslint-disable turbo/no-undeclared-env-vars */
import { Logger as L, LevelWithSilentOrString, multistream, pino } from 'pino';
import build from 'pino-abstract-transport';
import { build as pretty } from 'pino-pretty';
import { z } from 'zod';

export type Logger = L;
export type LogLevel = LevelWithSilentOrString;

/**
 * Log messages to the OpenObserve platform.
 */
export class SystemLogService {
  private readonly defaultLevelMap = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal',
  };
  private readonly logSchema = z.object({
    level: z.number(),
    time: z.number(),
    msg: z.unknown(),
  });

  public instance: L;

  constructor(
    webhookUrl: string,
    identifier: string,
    defaultLogLevel: LevelWithSilentOrString = 'info',
  ) {
    this.instance = pino(
      { level: defaultLogLevel },
      multistream([
        {
          stream: pretty({}),
          level: defaultLogLevel,
        },
        {
          stream: this.discord(webhookUrl, identifier),
          level: 'info',
        },
      ]),
    );
  }

  private discord(webhookUrl: string, identifier: string) {
    return build(async (source) => {
      for await (const log of source) {
        try {
          const { time, level, msg } = this.logSchema.parse(log);

          const date = new Date(time).toISOString();

          const levelName =
            level in this.defaultLevelMap
              ? this.defaultLevelMap[level as keyof typeof this.defaultLevelMap]
              : 'unknown';

          let message = '';
          if (typeof msg === 'string') {
            message = msg;
          } else {
            try {
              message = JSON.stringify(msg);
            } catch {
              message = '(Failed to serialize log message)';
            }
          }

          const nodeEnv =
            'NODE_ENV' in process.env && typeof process.env.NODE_ENV === 'string'
              ? process.env.NODE_ENV
              : 'unknown environment';

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: `\`[${levelName}][${identifier}] @ ${date} (${nodeEnv})\`\n${message}`,
            }),
          });

          if (response.ok) {
            return;
          } else {
            console.error('Failed to send logs:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Failed to send logs:', error);
        }
      }
    });
  }
}
