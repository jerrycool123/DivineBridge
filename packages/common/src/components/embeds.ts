import { EmbedBuilder } from '@discordjs/builders';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { GuildDoc } from '../models/guild.js';
import { MembershipRoleDoc } from '../models/membership-role.js';
import { MembershipDoc } from '../models/membership.js';
import { YouTubeChannelDoc } from '../models/youtube-channel.js';
import { UserPayload } from '../types/common.js';
import { RecognizedDate } from '../types/common.js';
import { CommonUtils } from '../utils/common.js';
import { DiscordUtils } from '../utils/discord.js';

dayjs.extend(utc);

export namespace Embeds {
  const baseEmbed = (): EmbedBuilder => {
    return new EmbedBuilder().setTimestamp().setColor(CommonUtils.getRandomColor());
  };

  const baseUserEmbed = (user: UserPayload): EmbedBuilder => {
    return baseEmbed()
      .setAuthor({ name: user.name, iconURL: user.image })
      .setFooter({ text: `User ID: ${user.id}` });
  };

  export const guildSettings = (
    user: UserPayload,
    guildDoc: GuildDoc,
    membershipRoleDocs: (Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc | null;
    })[],
  ): EmbedBuilder => {
    return baseUserEmbed(user)
      .setTitle('Guild Settings')
      .setThumbnail(guildDoc.profile.icon)
      .addFields([
        {
          name: 'Guild name',
          value: guildDoc.profile.name,
          inline: true,
        },
        {
          name: 'Guild ID',
          value: guildDoc._id,
          inline: true,
        },
        {
          name: 'Log channel',
          value: guildDoc.config.logChannel !== null ? `<#${guildDoc.config.logChannel}>` : 'None',
        },
        {
          name: 'Membership Roles',
          value:
            membershipRoleDocs.length > 0
              ? membershipRoleDocs
                  .map(
                    ({ _id: membershipRoleId, config, youtube }) =>
                      `\`/${config.aliasCommandName}\` - <@&${membershipRoleId}> - ${
                        youtube !== null
                          ? `[${youtube.profile.title}](https://www.youtube.com/channel/${youtube._id}) ([${youtube.profile.customUrl}](https://www.youtube.com/${youtube.profile.customUrl}))`
                          : '[Unknown Channel]'
                      }`,
                  )
                  .join('\n')
              : 'None',
        },
      ]);
  };

  export const youtubeChannel = (youtubeChannel: {
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnail: string;
  }): EmbedBuilder => {
    return baseEmbed()
      .setAuthor({
        name: youtubeChannel.title,
        iconURL: `https://www.youtube.com/${youtubeChannel.customUrl}`,
      })
      .setTitle(youtubeChannel.title)
      .setDescription(youtubeChannel.description)
      .setThumbnail(youtubeChannel.thumbnail)
      .addFields([
        {
          name: 'Channel ID',
          value: youtubeChannel.id,
          inline: true,
        },
        {
          name: 'Channel Link',
          value: `[${youtubeChannel.customUrl}](https://www.youtube.com/${youtubeChannel.customUrl})`,
          inline: true,
        },
      ]);
  };

  export const membership = (user: UserPayload, membership: MembershipDoc) => {
    return baseUserEmbed(user)
      .setTitle('Membership')
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${membership.membershipRole}>`,
          inline: true,
        },
        {
          name: 'Begin Date',
          value: dayjs(membership.begin).format('YYYY-MM-DD'),
        },
        {
          name: 'End Date',
          value: dayjs(membership.end).format('YYYY-MM-DD'),
        },
      ]);
  };

  export const manualMembershipAssignment = (
    user: UserPayload,
    begin: Date,
    end: Date,
    roleId: string,
    moderatorId?: string,
  ): EmbedBuilder => {
    return baseUserEmbed(user)
      .setTitle('✅ Manual Membership Assignment')
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: 'Begin Date',
          value: dayjs.utc(begin).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: 'End Date',
          value: dayjs.utc(end).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: 'Assigned By',
          value: moderatorId !== undefined ? `<@${moderatorId}>` : 'Unknown',
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.success));
  };

  export const manualMembershipRemoval = (
    user: UserPayload,
    roleId: string,
    moderatorId: string,
  ): EmbedBuilder => {
    return baseUserEmbed(user)
      .setTitle(`❌ Manual Membership Removal`)
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: 'Removed By',
          value: `<@${moderatorId}>`,
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.error));
  };

  export const membershipStatus = (
    user: UserPayload,
    memberships: {
      manual: (Omit<MembershipDoc, 'membershipRole'> & { membershipRole: MembershipRoleDoc })[];
      screenshot: (Omit<MembershipDoc, 'membershipRole'> & { membershipRole: MembershipRoleDoc })[];
      auth: (Omit<MembershipDoc, 'membershipRole'> & { membershipRole: MembershipRoleDoc })[];
      live_chat: (Omit<MembershipDoc, 'membershipRole'> & { membershipRole: MembershipRoleDoc })[];
    },
  ): EmbedBuilder => {
    const toString = (
      input: (Omit<MembershipDoc, 'membershipRole'> & {
        membershipRole: MembershipRoleDoc;
      })[],
    ): string => {
      if (input.length === 0) return 'None';
      return input
        .map(
          (membershipDoc) =>
            `<@&${membershipDoc.membershipRole._id}> (\`${dayjs
              .utc(membershipDoc.begin)
              .format('YYYY-MM-DD')}\` ~ \`${dayjs.utc(membershipDoc.end).format('YYYY-MM-DD')}\`)`,
        )
        .join('\n');
    };
    return baseUserEmbed(user)
      .setTitle(`Membership Status`)
      .addFields([
        {
          name: 'Manual Memberships',
          value: toString(memberships.manual),
        },
        {
          name: 'Screenshot Memberships',
          value: toString(memberships.screenshot),
        },
        {
          name: 'Auth Memberships',
          value: toString(memberships.auth),
        },
        {
          name: 'Live Chat Memberships',
          value: toString(memberships.live_chat),
        },
      ]);
  };

  export const screenshotSubmission = (
    user: UserPayload,
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    },
    languageName: string,
    guildName: string,
    imageUrl: string,
  ): EmbedBuilder => {
    return baseUserEmbed(user)
      .setTitle('Screenshot Submitted')
      .setDescription(
        'After I finished recognizing your screenshot, ' +
          'it will be sent to the moderators of the server for further verification.\n' +
          'You will receive a DM when your membership is verified.',
      )
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${membershipRoleDoc._id}>`,
          inline: true,
        },
        {
          name: 'Language',
          value: languageName,
          inline: true,
        },
        {
          name: 'Discord Server',
          value: guildName,
          inline: true,
        },
      ])
      .setImage(imageUrl)
      .setColor(membershipRoleDoc.profile.color);
  };

  export const membershipVerificationRequest = (
    user: UserPayload,
    date: RecognizedDate,
    roleId: string,
    languageName: string,
    imageUrl: string,
  ): EmbedBuilder => {
    const { year, month, day } = date;

    return baseUserEmbed(user)
      .setTitle('Membership Verification Request')
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: 'Recognized Date',
          value:
            year !== null && month !== null && day !== null
              ? `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              : '**Not Recognized**',
          inline: true,
        },
        {
          name: 'Language',
          value: languageName,
          inline: true,
        },
      ])
      .setImage(imageUrl)
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.request));
  };

  export const authMembership = (
    user: UserPayload,
    membershipRoleId: string,
    membershipDoc: MembershipDoc,
  ): EmbedBuilder => {
    return baseUserEmbed(user)
      .setTitle('✅ New Auth Membership')
      .addFields([
        {
          name: 'Membership Role',
          value: `<@&${membershipRoleId}>`,
          inline: true,
        },
        {
          name: 'Begin Date',
          value: dayjs(membershipDoc.begin).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: 'End Date',
          value: dayjs(membershipDoc.end).format('YYYY-MM-DD'),
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.success));
  };
}
