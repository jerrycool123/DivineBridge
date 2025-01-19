import { Logger as L, LevelWithSilentOrString, pino } from 'pino';
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
  private readonly username: string;
  private readonly password: string;
  private readonly domain: string;
  private readonly organization: string;
  private readonly streamName: string;
  private readonly identifier: string;

  constructor(uri: string, identifier: string, defaultLogLevel: LevelWithSilentOrString = 'info') {
    // The URL class will throw an error if the URI is not valid
    const parsedUrl = new URL(uri);
    this.identifier = identifier;

    // Extract the username and password from the URL
    this.username = decodeURIComponent(parsedUrl.username);
    this.password = decodeURIComponent(parsedUrl.password);

    // Extract the hostname (without the scheme)
    this.domain = parsedUrl.hostname;

    // Extract the path segments
    const pathSegments = parsedUrl.pathname.split('/').filter((segment) => segment.length > 0);

    // Ensure the path has the expected number of segments for org and stream_name
    if (pathSegments.length !== 3 || pathSegments[0] !== 'api') {
      throw new Error('Invalid path in the URI. Expected format: /api/{org}/{stream_name}');
    }

    // Extract org and stream_name from the path
    this.organization = pathSegments[1];
    this.streamName = pathSegments[2];

    this.instance = pino(
      { level: defaultLogLevel },
      pino.multistream([{ stream: pretty({}), level: defaultLogLevel }, this.openObserve()]),
    );
  }

  private openObserve() {
    return build(async (source) => {
      for await (const log of source) {
        void this.sendLog(log);
      }
    });
  }

  private async sendLog(log: unknown) {
    try {
      const { time, level, msg } = this.logSchema.parse(log);

      const response = await fetch(
        `https://${this.domain}/api/${this.organization}/${this.streamName}/_multi`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _timestamp: time,
            date: new Date(time).toISOString(),
            identifier: this.identifier,
            level,
            level_name:
              level in this.defaultLevelMap
                ? this.defaultLevelMap[level as keyof typeof this.defaultLevelMap]
                : 'unknown',
            msg,
          }),
        },
      );

      if (response.ok) {
        return;
      } else {
        console.error('Failed to send logs:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to send logs:', error);
    }
  }
}
