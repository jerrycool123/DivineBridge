import dayjs from 'dayjs';

import { GuildCollection, GuildDoc } from '../models/guild.js';
import { MembershipRoleCollection, MembershipRoleDoc } from '../models/membership-role.js';
import { MembershipCollection, MembershipDoc } from '../models/membership.js';
import { UserCollection, UserDoc } from '../models/user.js';
import { YouTubeChannelCollection, YouTubeChannelDoc } from '../models/youtube-channel.js';
import { GuildPayload, UserPayload } from '../types/common.js';

export namespace Database {
  export const upsertGuild = async (
    guild: GuildPayload & {
      logChannel?: string | null;
      locale?: string;
    },
  ): Promise<GuildDoc> => {
    return await GuildCollection.findByIdAndUpdate(
      guild.id,
      {
        $set: {
          'profile.name': guild.name,
          'profile.icon': guild.icon,
          ...(guild.logChannel !== undefined && { 'config.logChannel': guild.logChannel }),
          ...(guild.locale !== undefined && { 'config.locale': guild.locale }),
        },
        $setOnInsert: {
          _id: guild.id,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  };

  export const upsertYouTubeChannel = async (
    youtubeChannel: {
      id: string;
      title: string;
      description: string;
      customUrl: string;
      thumbnail: string;
    },
    memberOnlyVideoIds: string[],
  ): Promise<YouTubeChannelDoc> => {
    return await YouTubeChannelCollection.findByIdAndUpdate(
      youtubeChannel.id,
      {
        $set: {
          'profile.title': youtubeChannel.title,
          'profile.description': youtubeChannel.description,
          'profile.customUrl': youtubeChannel.customUrl,
          'profile.thumbnail': youtubeChannel.thumbnail,
          memberOnlyVideoIds,
        },
        $setOnInsert: {
          _id: youtubeChannel.id,
        },
      },
      { upsert: true, new: true },
    );
  };

  export const upsertUser = async (
    user: UserPayload & {
      locale?: string;
    },
  ): Promise<UserDoc> => {
    return await UserCollection.findByIdAndUpdate(
      user.id,
      {
        $set: {
          'profile.username': user.name,
          'profile.image': user.image,
          ...(user.locale !== undefined && { 'preference.locale': user.locale }),
        },
        $setOnInsert: {
          _id: user.id,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  };

  export const upsertMembership = async (membership: {
    userId: string;
    membershipRoleId: string;
    type: MembershipDoc['type'];
    begin: dayjs.Dayjs;
    end: dayjs.Dayjs;
  }): Promise<MembershipDoc> => {
    return await MembershipCollection.findOneAndUpdate(
      {
        user: membership.userId,
        membershipRole: membership.membershipRoleId,
      },
      {
        $set: {
          type: membership.type,
          begin: membership.begin.toDate(),
          end: membership.end.toDate(),
        },
        $setOnInsert: {
          user: membership.userId,
          membershipRole: membership.membershipRoleId,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  };

  export const updateMembershipRole = async (role: {
    id: string;
    name: string;
    color: number;
  }): Promise<MembershipRoleDoc | null> => {
    return await MembershipRoleCollection.findByIdAndUpdate(
      role.id,
      {
        $set: {
          'profile.name': role.name,
          'profile.color': role.color,
        },
      },
      {
        new: true,
      },
    );
  };
}
