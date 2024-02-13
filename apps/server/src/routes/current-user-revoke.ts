import {
  RevokeCurrentUserYouTubeRefreshTokenRequest,
  UserCollection,
  symmetricDecrypt,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';

import { GoogleService } from '../services/google.js';
import { Env } from '../utils/env.js';

export class CurrentUserRevokeRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/users/@me/revoke' });
  }

  public async [methods.POST](request: ApiRequest, response: ApiResponse) {
    const { session } = request;
    if (session === undefined) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    const user = await UserCollection.findById(session.id);
    if (user === null) {
      return response.status(400).json({ message: 'User not found' });
    } else if (user.youtube === null) {
      return response.status(400).json({ message: 'You have not connected your YouTube account' });
    }
    const refreshToken = symmetricDecrypt(user.youtube.refreshToken, Env.DATA_ENCRYPTION_KEY);
    if (refreshToken === null) {
      // throw new BadRequestError('Failed to decrypt YouTube refresh token');
      this.container.logger.error(
        `Failed to decrypt YouTube refresh token for user <@${user._id}>`,
      );
    }

    // Revoke YouTube refresh token
    // ? We don't do error handling here and proceed to remove the user's YouTube account from DB
    if (refreshToken !== null) {
      await GoogleService.revokeRefreshToken(refreshToken);
    }
    user.youtube = null;
    await user.save();

    const resBody: RevokeCurrentUserYouTubeRefreshTokenRequest['res'] = {
      message: 'success',
    };

    return response.status(200).json(resBody);
  }
}
