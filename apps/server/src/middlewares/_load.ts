import { container } from '@sapphire/framework';

import { PluginMiddleware as PluginSession } from './session.js';

export function loadMiddlewares() {
  const store = 'middlewares' as const;
  void container.stores.loadPiece({ name: 'session', piece: PluginSession, store });
}
