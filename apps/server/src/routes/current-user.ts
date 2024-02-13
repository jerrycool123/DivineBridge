import {
  MembershipCollection,
  MembershipDoc,
  MembershipRoleDoc,
  ReadCurrentUserRequest,
  UserCollection,
  symmetricDecrypt,
} from '@divine-bridge/common';
import { type ApiRequest, type ApiResponse, Route, methods } from '@sapphire/plugin-api';
import { GuildMember, GuildTextBasedChannel } from 'discord.js';

import { GoogleService } from '../services/google.js';
import { MembershipService } from '../services/membership.js';
import { Env } from '../utils/env.js';
import { Fetchers } from '../utils/fetchers.js';
import { Utils } from '../utils/index.js';
import { Validators } from '../utils/validators.js';

export class CurrentUserRoute extends Route {
  public constructor(context: Route.LoaderContext, options: Route.Options) {
    super(context, { ...options, route: '/users/@me' });
  }

  public async [methods.GET](request: ApiRequest, response: ApiResponse) {
    const { session } = request;
    if (session === undefined) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    const user = await UserCollection.findById(session.id);
    if (user === null) {
      return response.status(400).json({ message: 'User not found' });
    }

    const resBody: ReadCurrentUserRequest['res'] = {
      id: user._id,
      profile: {
        username: user.profile.username,
        image: user.profile.image,
      },
      youtube:
        user.youtube !== null
          ? {
              id: user.youtube.id,
              title: user.youtube.title,
              customUrl: user.youtube.customUrl,
              thumbnail: user.youtube.thumbnail,
            }
          : null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
    return response.status(200).json(resBody);
  }

  public async [methods.DELETE](request: ApiRequest, response: ApiResponse) {
    const { session } = request;
    if (session === undefined) {
      return response.status(401).json({ message: 'Unauthorized' });
    }

    const user = await UserCollection.findById(session.id);
    if (user === null) {
      return response.status(400).json({ message: 'User not found' });
    }
    if (user.youtube !== null) {
      const refreshToken = symmetricDecrypt(user.youtube.refreshToken, Env.DATA_ENCRYPTION_KEY);
      if (refreshToken !== null) {
        // Revoke YouTube refresh token
        // ? We don't do error handling here and proceed to remove the membership
        await GoogleService.revokeRefreshToken(refreshToken);
      }
    }

    // Get user's memberships in DB
    const membershipDocs = await MembershipCollection.find({
      user: user._id,
    }).populate<{
      membershipRole: MembershipRoleDoc | null;
    }>('membershipRole');

    // Split valid and invalid memberships
    const validMembershipDocs: (Omit<MembershipDoc, 'membershipRole'> & {
      membershipRole: MembershipRoleDoc;
    })[] = [];
    const invalidMembershipDocs: (Omit<MembershipDoc, 'membershipRole'> & {
      membershipRole: null;
    })[] = [];
    for (const membershipDoc of membershipDocs) {
      if (membershipDoc.membershipRole !== null) {
        validMembershipDocs.push(
          membershipDoc as Omit<MembershipDoc, 'membershipRole'> & {
            membershipRole: MembershipRoleDoc;
          },
        );
      } else {
        invalidMembershipDocs.push(
          membershipDoc as Omit<MembershipDoc, 'membershipRole'> & {
            membershipRole: null;
          },
        );
      }
    }

    // Remove invalid memberships
    await MembershipCollection.deleteMany({
      _id: {
        $in: invalidMembershipDocs.map((membershipDoc) => membershipDoc._id),
      },
    });

    // Group valid membership docs by guild
    const membershipDocRecord = validMembershipDocs.reduce<
      Record<
        string,
        (Omit<MembershipDoc, 'membershipRole'> & {
          membershipRole: MembershipRoleDoc;
        })[]
      >
    >((prev, membershipDoc) => {
      const guildId = membershipDoc.membershipRole.guild;
      return { ...prev, [guildId]: [...(guildId in prev ? prev[guildId] : []), membershipDoc] };
    }, {});

    // Remove memberships by group
    for (const [guildId, membershipDocGroup] of Object.entries(membershipDocRecord)) {
      if (membershipDocGroup.length === 0) continue;

      // Initialize guild, guild owner, and log channel
      const guild = await Fetchers.fetchGuild(guildId);
      let guildOwner: GuildMember | null = null;
      let logChannel: GuildTextBasedChannel | null = null;
      if (guild !== null) {
        // Get guild owner and log channel
        const [guildOwnerResult, logChannelResult] = await Promise.all([
          Fetchers.fetchGuildOwner(guild),
          Validators.isGuildHasLogChannel(guild),
        ]);
        guildOwner = guildOwnerResult;
        logChannel = logChannelResult.success ? logChannelResult.data : null;
      }

      // Remove membership
      const failedRoleRemovalIds: string[] = [];
      for (const membershipDoc of membershipDocGroup) {
        const removeMembershipResult = await MembershipService.removeMembership({
          guild: guild ?? guildId,
          membershipRoleDoc: membershipDoc.membershipRole,
          membershipDoc,
          removeReason: `you have deleted your account from Divine Bridge`,
          continueOnError: true,
        });
        if (
          removeMembershipResult.success === false ||
          removeMembershipResult.roleRemoved === false
        ) {
          failedRoleRemovalIds.push(membershipDoc.membershipRole._id);
        }
      }

      // Send log to the log channel if there are failed role removals
      if (failedRoleRemovalIds.length > 0) {
        await Utils.sendEventLog({
          guildOwner,
          logChannel,
          payload: {
            content:
              `The user <@!${user._id}> has deleted their account from Divine Bridge.\n` +
              `However, I can't remove the following membership roles from the user:\n` +
              failedRoleRemovalIds.map((id) => `<@&${id}>`).join('\n') +
              `\n\nPlease manually remove the roles from the user, and check if the bot has correct permissions.`,
          },
        });
      }
    }

    // Remove user from DB
    await user.deleteOne();

    return response.status(204).end();
  }
}
