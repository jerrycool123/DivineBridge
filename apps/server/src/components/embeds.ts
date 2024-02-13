import {
  GuildDoc,
  MembershipDoc,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { ButtonInteraction, Embed, EmbedBuilder, User } from 'discord.js';

import { Constants } from '../constants.js';
import { OCRTypes } from '../services/ocr/types.js';
import { ActionRows } from './action-rows.js';

dayjs.extend(utc);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export namespace Embeds {
  const baseEmbed = (): EmbedBuilder => {
    return new EmbedBuilder().setTimestamp().setColor('Random');
  };

  const baseUserEmbed = (user: User): EmbedBuilder => {
    return baseEmbed()
      .setAuthor({
        name: user.username,
        iconURL: user.displayAvatarURL(),
      })
      .setFooter({ text: `User ID: ${user.id}` });
  };

  export const guildSettings = (
    user: User,
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

  export const membership = (user: User, membership: MembershipDoc) => {
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
    user: User,
    begin: Date,
    end: Date,
    roleId: string,
    moderatorId: string,
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
          value: `<@${moderatorId}>`,
          inline: true,
        },
      ])
      .setColor(Constants.colors.success);
  };

  export const manualMembershipRemoval = (
    user: User,
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
      .setColor(Constants.colors.error);
  };

  export const membershipStatus = (
    user: User,
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
    user: User,
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
    user: User,
    date: OCRTypes.RecognizedDate,
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
      .setColor(Constants.colors.request);
  };

  export const parseMembershipVerificationRequestEmbed = async (
    interaction: ButtonInteraction,
  ): Promise<
    | {
        success: true;
        embed: Embed;
        userId: string;
        beginDate: dayjs.Dayjs;
        endDate: dayjs.Dayjs | null;
        endDateIndex: number;
        roleId: string;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    const returnError = async (error: string) => {
      const invalidActionRow = ActionRows.disabledInvalidButton();
      await interaction.message.edit({
        components: [invalidActionRow],
      });
      return { success: false, error } as const;
    };

    if (interaction.message.embeds.length === 0) {
      return await returnError('The message does not contain an embed.');
    }
    const embed = interaction.message.embeds[0];

    const userId = embed.footer?.text.split('User ID: ')[1] ?? null;
    if (userId === null) {
      return await returnError(
        'The embed footer does not contain a user ID in the form of `User ID: {userId}`.',
      );
    }

    const beginDateString = embed.timestamp;
    const beginDate = beginDateString !== null ? dayjs.utc(beginDateString).startOf('date') : null;
    if (beginDate === null || !beginDate.isValid()) {
      return await returnError(`The embed timestamp does not contain a valid date.`);
    }

    const endDateIndex = embed.fields.findIndex(({ name }) => name === 'Recognized Date');
    if (endDateIndex === -1) {
      return await returnError('The embed does not contain a `Recognized Date` field.');
    }
    const endDateString = endDateIndex !== -1 ? embed.fields[endDateIndex].value : null;
    const rawEndDate =
      endDateString !== null ? dayjs.utc(endDateString, 'YYYY-MM-DD', true).startOf('date') : null;
    const endDate = rawEndDate?.isValid() ?? false ? rawEndDate : null;

    const roleRegex = /<@&(\d+)>/;
    const roleId =
      embed.fields.find(({ name }) => name === 'Membership Role')?.value?.match(roleRegex)?.[1] ??
      null;
    if (roleId === null) {
      return await returnError(
        'The embed does not contain a valid role ID in the `Membership Role` field.',
      );
    }

    return { success: true, embed, userId, beginDate, endDate, endDateIndex, roleId };
  };

  export const authMembership = (
    user: User,
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
      .setColor(Constants.colors.success);
  };
}
