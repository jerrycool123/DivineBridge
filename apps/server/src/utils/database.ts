import {
  GuildCollection,
  GuildDoc,
  MembershipCollection,
  MembershipDoc,
  MembershipRoleCollection,
  MembershipRoleDoc,
  UserCollection,
  UserDoc,
  YouTubeChannelCollection,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import dayjs from 'dayjs';

export namespace Database {
  export const upsertGuild = async (guild: {
    id: string;
    name: string;
    icon: string | null;
    logChannel?: string | null;
  }): Promise<GuildDoc> => {
    return await GuildCollection.findByIdAndUpdate(
      guild.id,
      {
        $set: {
          'profile.name': guild.name,
          'profile.icon': guild.icon,
          ...(guild.logChannel !== undefined && { 'config.logChannel': guild.logChannel }),
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

  export const upsertUser = async (user: {
    id: string;
    username: string;
    avatar: string;
  }): Promise<UserDoc> => {
    return await UserCollection.findByIdAndUpdate(
      user.id,
      {
        $set: {
          'profile.username': user.username,
          'profile.avatar': user.avatar,
        },
        $setOnInsert: { _id: user.id },
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
