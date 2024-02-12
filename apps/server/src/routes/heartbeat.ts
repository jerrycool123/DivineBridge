import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';

export class HeartbeatRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/heartbeat' });
  }

  public [methods.GET](_request: ApiRequest, response: ApiResponse) {
    response.status(204).end();
  }
}
