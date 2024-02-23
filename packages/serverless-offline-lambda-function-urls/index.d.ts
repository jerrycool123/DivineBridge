import Serverless from 'serverless';

export default class ServerlessOfflineLambdaFunctionUrls {
  private constructor(serverless: Serverless);

  getLambdas(functions: Record<string, unknown>): Array<{
    functionKey: string;
    functionDefinition: unknown;
  }>;

  filterNonUrlEnabledFunctions(configuration: {
    functions: Record<string, unknown>;
  }): Record<string, unknown>;

  getEvents(functions: Record<string, unknown>): Array<{
    functionKey: string;
    handler: string;
    http: {
      routeKey: string;
      payload: string;
      isHttpApi: boolean;
      path: string;
      method: string;
    };
  }>;

  getStage(): string;

  mergeServerlessOfflineOptions(options: Record<string, unknown>): Record<string, unknown>;

  getTranspiledHandlerFilepath(handler: string): string;

  getFullPath(...args: string[]): string;

  init(): Promise<void>;

  cleanup(): void;
}
