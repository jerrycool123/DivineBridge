import { EmbedBuilder } from '@discordjs/builders';
import { TFunc } from '@divine-bridge/i18n';
import type { RecognizedDate } from '@divine-bridge/ocr-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

import { GuildDoc } from '../models/guild.js';
import { MembershipRoleDoc } from '../models/membership-role.js';
import { MembershipDoc } from '../models/membership.js';
import { YouTubeChannelDoc } from '../models/youtube-channel.js';
import { UserPayload } from '../types/common.js';
import { CommonUtils } from '../utils/common.js';
import { DiscordUtils } from '../utils/discord.js';

dayjs.extend(utc);

export namespace Embeds {
  const baseEmbed = (): EmbedBuilder => {
    return new EmbedBuilder().setTimestamp().setColor(CommonUtils.getRandomColor());
  };

  const baseUserEmbed = (t: TFunc, user: UserPayload): EmbedBuilder => {
    return baseEmbed()
      .setAuthor({ name: user.name, iconURL: user.image })
      .setFooter({ text: `🪪 ${t('common.User ID')}: ${user.id}` });
  };

  export const serverSettings = (
    t: TFunc,
    user: UserPayload,
    guildDoc: GuildDoc,
    membershipRoleDocs: (Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc | null;
    })[],
  ): EmbedBuilder => {
    return baseUserEmbed(t, user)
      .setTitle(t('common.Server Settings'))
      .setThumbnail(guildDoc.profile.icon)
      .addFields([
        {
          name: t('common.Server Name'),
          value: guildDoc.profile.name,
          inline: true,
        },
        {
          name: t('common.Server ID'),
          value: guildDoc._id,
          inline: true,
        },
        {
          name: t('common.Server Language'),
          value: guildDoc.config.locale ?? t('common.Auto'),
          inline: true,
        },
        {
          name: t('common.Log Channel'),
          value: guildDoc.config.logChannel !== null ? `<#${guildDoc.config.logChannel}>` : 'None',
        },
        {
          name: t('common.Membership Roles'),
          value:
            membershipRoleDocs.length > 0
              ? membershipRoleDocs
                  .map(
                    ({ _id: membershipRoleId, config, youtube }) =>
                      `\`/${config.aliasCommandName}\` - <@&${membershipRoleId}> - ${
                        youtube !== null
                          ? `[${youtube.profile.title}](https://www.youtube.com/channel/${youtube._id})`
                          : `[${t('common.Unknown Channel')}]`
                      }`,
                  )
                  .join('\n')
              : t('common.None'),
        },
      ]);
  };

  export const youtubeChannel = (
    t: TFunc,
    youtubeChannel: {
      id: string;
      title: string;
      description: string;
      customUrl: string;
      thumbnail: string;
    },
  ): EmbedBuilder => {
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
          name: t('common.Channel ID'),
          value: youtubeChannel.id,
          inline: true,
        },
        {
          name: t('common.Channel Link'),
          value: `[${youtubeChannel.customUrl}](https://www.youtube.com/${youtubeChannel.customUrl})`,
          inline: true,
        },
      ]);
  };

  export const membership = (t: TFunc, user: UserPayload, membership: MembershipDoc) => {
    return baseUserEmbed(t, user)
      .setTitle(t('common.Membership'))
      .addFields([
        {
          name: t('common.Membership Role'),
          value: `<@&${membership.membershipRole}>`,
          inline: true,
        },
        {
          name: t('common.Begin Date'),
          value: dayjs(membership.begin).format('YYYY-MM-DD'),
        },
        {
          name: t('common.End Date'),
          value: dayjs(membership.end).format('YYYY-MM-DD'),
        },
      ]);
  };

  export const manualMembershipAssignment = (
    t: TFunc,
    user: UserPayload,
    begin: Date,
    end: Date,
    roleId: string,
    moderatorId?: string,
  ): EmbedBuilder => {
    return baseUserEmbed(t, user)
      .setTitle(`✅ ${t('common.Manual Membership Assignment')}`)
      .addFields([
        {
          name: t('common.Membership Role'),
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: t('common.Begin Date'),
          value: dayjs.utc(begin).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: t('common.End Date'),
          value: dayjs.utc(end).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: t('common.Assigned By'),
          value: moderatorId !== undefined ? `<@${moderatorId}>` : t('common.Unknown'),
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.success));
  };

  export const manualMembershipRemoval = (
    t: TFunc,
    user: UserPayload,
    roleId: string,
    moderatorId: string,
  ): EmbedBuilder => {
    return baseUserEmbed(t, user)
      .setTitle(`❌ ${t('common.Manual Membership Removal')}`)
      .addFields([
        {
          name: t('common.Membership Role'),
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: t('common.Removed By'),
          value: `<@${moderatorId}>`,
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.error));
  };

  export const membershipStatus = (
    t: TFunc,
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
      if (input.length === 0) return t('common.None');
      return input
        .map(
          (membershipDoc) =>
            `<@&${membershipDoc.membershipRole._id}> (\`${dayjs
              .utc(membershipDoc.begin)
              .format('YYYY-MM-DD')}\` ~ \`${dayjs.utc(membershipDoc.end).format('YYYY-MM-DD')}\`)`,
        )
        .join('\n');
    };
    return baseUserEmbed(t, user)
      .setTitle(t('common.Membership Status'))
      .addFields([
        {
          name: t('common.Manual Memberships'),
          value: toString(memberships.manual),
        },
        {
          name: t('common.Screenshot Memberships'),
          value: toString(memberships.screenshot),
        },
        {
          name: t('common.Auth Memberships'),
          value: toString(memberships.auth),
        },
        {
          name: t('common.Live Chat Memberships'),
          value: toString(memberships.live_chat),
        },
      ]);
  };

  export const screenshotSubmission = (
    t: TFunc,
    user: UserPayload,
    membershipRoleDoc: Omit<MembershipRoleDoc, 'youtube'> & {
      youtube: YouTubeChannelDoc;
    },
    languageName: string,
    guildName: string,
    imageUrl: string,
  ): EmbedBuilder => {
    return baseUserEmbed(t, user)
      .setTitle(t('common.Screenshot Submitted'))
      .setDescription(
        t(
          'common.After I finished recognizing your screenshot it will be sent to the moderators of the server for further verification',
        ) +
          '\n' +
          t('common.You will receive a DM when your membership is verified'),
      )
      .addFields([
        {
          name: t('common.Membership Role'),
          value: `<@&${membershipRoleDoc._id}>`,
          inline: true,
        },
        {
          name: t('common.Language'),
          value: languageName,
          inline: true,
        },
        {
          name: t('common.Discord Server'),
          value: guildName,
          inline: true,
        },
      ])
      .setImage(imageUrl)
      .setColor(membershipRoleDoc.profile.color);
  };

  export const membershipVerificationRequest = (
    t: TFunc,
    user: UserPayload,
    date: RecognizedDate,
    roleId: string,
    languageName: string,
    imageUrl: string,
  ): EmbedBuilder => {
    const { year, month, day } = date;

    return baseUserEmbed(t, user)
      .setTitle(t('common.Membership Verification Request'))
      .addFields([
        {
          name: `⭐️ ${t('common.Membership Role')}`,
          value: `<@&${roleId}>`,
          inline: true,
        },
        {
          name: `📅 ${t('common.Recognized Date')}`,
          value:
            year !== null && month !== null && day !== null
              ? `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              : `**${t('common.Not Recognized')}**`,
          inline: true,
        },
        {
          name: t('common.Language'),
          value: languageName,
          inline: true,
        },
      ])
      .setImage(imageUrl)
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.request));
  };

  export const authMembership = (
    t: TFunc,
    user: UserPayload,
    membershipRoleId: string,
    membershipDoc: MembershipDoc,
  ): EmbedBuilder => {
    return baseUserEmbed(t, user)
      .setTitle(`✅ ${t('common.New Auth Membership')}`)
      .addFields([
        {
          name: t('common.Membership Role'),
          value: `<@&${membershipRoleId}>`,
          inline: true,
        },
        {
          name: t('common.Begin Date'),
          value: dayjs(membershipDoc.begin).format('YYYY-MM-DD'),
          inline: true,
        },
        {
          name: t('common.End Date'),
          value: dayjs(membershipDoc.end).format('YYYY-MM-DD'),
          inline: true,
        },
      ])
      .setColor(CommonUtils.hex2int(DiscordUtils.colors.success));
  };
}
