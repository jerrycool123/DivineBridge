import { EmbedBuilder } from '@discordjs/builders';
import type { TranslationKey } from '@divine-bridge/i18n';
import { TFunc } from '@divine-bridge/i18n';
import type { RecognizedDate } from '@divine-bridge/ocr-service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dedent from 'dedent';

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
        dedent`
          ${t(
            'common.After I finished recognizing your screenshot it will be sent to the moderators of the server for further verification',
          )}
          ${t('common.You will receive a DM when your membership is verified')}
        `,
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

  export const userTutorial = (
    t: TFunc,
    membershipRoleDocs:
      | (Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        })[]
      | null,
  ): EmbedBuilder => {
    return new EmbedBuilder().setTitle(t('common.User Tutorial')).setDescription(
      dedent`
        ${t('common.Welcome to use Divine Bridge Heres a quick tutorial to get you started')}

        **__${t('common.Prerequisites')}__**
        
        ${t('common.The server moderators must have added a membership role in the server If you are a server moderator you can view the Moderator Tutorial to learn how to add a membership role')}

        **__${t('common.Auth Mode')}__**

        > ${t('common.You need to verify your membership every month')}

        **1**. ${t('common.Go to Divine Bridges')}[${t('common.website')}](https://divine-bridge.jerrycool123.com/)${t('common.and click the Sign in button and sign in with your Discord account')}

        **2**. ${t('common.Go to the')}[${t('common.dashboard')}](https://divine-bridge.jerrycool123.com/dashboard)${t('common.and click the Apply button of the membership role you would like to apply')}

        **3**. ${t('common.Click the Sign in with Google button and link your YouTube account')}

        **4**. ${t('common.Click the Verify button to verify your membership')}

        📝 **${t('common.Important Note')}**
        
        ${t('common.Once you are verified')}__${t('common.you dont have to do this again every month')}__
        ${t('common.Divine Bridge will automatically renew your membership duration')}

        ${t('common.This mode involves some')} __${t('common.cyber security and privacy')}__ ${t('common.concern')}
        **${t('common.You are strongly recommended to learn more about this in the Why Divine Bridge section on the')} [${t('common.website')}](https://divine-bridge.jerrycool123.com/)**.

        **__${t('common.Screenshot Mode')}__**

        > ${t('common.You need to sign in with YouTube and verify your membership once')}

        **1**. ${t('common.Please use')} \`/${t('verify_command.name')}\` ${t('common.command in the server where you want to apply the membership role')}
        
        ⭐️ **[${t('common.Recommended')}]** ${t('common.Each membership role has a')}**${t('common.Alias Command')}**${t('common.when you use the alias command you dont have to specify the membership role you want to verify')}
        ${
          membershipRoleDocs !== null && membershipRoleDocs.length > 0
            ? dedent`
            ${t('common.Here are the alias commands in this server')}
            ${membershipRoleDocs.map((membershipRoleDoc) => {
              return `- \`/${membershipRoleDoc.config.aliasCommandName}\`: ${t('verify_command.description_1')} ${membershipRoleDoc.youtube.profile.title} ${t('verify_command.description_2')}`;
            })}
          `
            : `${t('common.You can use')} \`/${t('help_command.name')}\` ${t('common.command and select')} \`${t('common.Command List')}\` ${t('common.to view the alias commands in a server')}`
        }

        **2**. ${t('common.Go to')}[**${t('common.Purchases and Memberships')}**](https://www.youtube.com/paid_memberships)${t('common.and take a screenshot')}

        ${t('common.The screenshot should include the following information')}
        - ${t('common.The YouTube channel name of the membership')}
        - ${t('common.Your name')}
        - ${t('common.The next billing date')}

        **3**. ${t('common.Submit your verification request and wait for moderators approval')}
        
        ${t('common.Server moderators will receive your membership verification request Once approved Divine Bridge will assign the membership role to you and notify you')}

        📝 **${t('common.Important Note')}**

        ${t('common.Every month 1 day before the expiry of your membership Divine Bridge will notify you that you need to send a screenshot of your new billing date you have')} __${t('common.24 Hours')}__ ${t('common.to do so')}
      `,
    );
  };

  export const moderatorTutorial = (t: TFunc, guildDoc: GuildDoc | null): EmbedBuilder => {
    return new EmbedBuilder().setTitle(t('common.Moderator Tutorial')).setDescription(
      dedent`
        ${t('common.Welcome to use Divine Bridge Heres a quick tutorial to get you started')}

        **__${t('common.Prerequisites')}__**

        ${t('common.You need to')} [**${t('common.invite Divine Bridge')}**](https://discord.com/oauth2/authorize?client_id=1243444258820853783&permissions=268435456&scope=bot+applications.commands) ${t('common.to your Discord server')}
        ${t('common.You need to have the')}**${t('common.Manage Roles')}**${t('common.permission in the server')}

        **__${t('common.Steps')}__**

        **1**. ${t('common.Use')} \`/${t('set_log_channel_command.name')}\` ${t('common.command to set the log channel for Divine Bridge')}

        ${t('common.Please make sure that the log channel is a private channel only accessible by server moderators')}

        ${t('common.Note that the bot requires to view the log channel send messages and embed links')}

        **2**. ${t('common.Use')} \`/${t('add_role_command.name')}\` ${t('common.command to add a YouTube membership role to the server')}

        ${t('common.You need to create a Discord role first in the server')}${t('common.Besides the highest role of the bot must be')}**${t('common.higher')}**${t('common.than the membership role in the role hierarchy')}${t('common.in order to manage the membership role')}

        ${t('common.You need to provide an')}**${t('common.alias command')}**${t('common.name for the membership role')}${t('common.This is a command name that users can use to verify their membership easier')}${t('common.When using the alias command the corresponding membership role will be automatically selected and the user will not need to select the membership role they want to verify again')}

        **3**. ${t('common.Handle the membership verification requests in the log channel')}

        ${t('common.When a user uses the')} **${t('common.Screenshot Mode')}** ${t('common.to verify their membership')}${t('common.the bot will send a message to the')}${guildDoc !== null && guildDoc.config.logChannel !== null ? `<#${guildDoc.config.logChannel}>` : t('common.log channel')}${t('common.period')}
        
        ${t('common.You can')} **${t('common.Approve')} ✅**${t('common.and_punctuation')}**${t('common.Reject')} ❌**${t('common.and_punctuation')}${t('common.or')} **${t('common.Modify')} 📝**${t('common.the verification request')}
      `,
    );
  };

  export const commandList = (
    t: TFunc,
    membershipRoleDocs:
      | (Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        })[]
      | null,
    chatInputCommandMap: Record<string, { moderatorOnly: boolean; devTeamOnly: boolean }>,
  ): EmbedBuilder => {
    return new EmbedBuilder().setTitle(t('common.Command List')).setDescription(
      dedent`
        ${t('common.Here are the commands you can use with Divine Bridge')}
        ${
          membershipRoleDocs !== null && membershipRoleDocs.length > 0
            ? '\n' +
              dedent`
                **__${t('common.Server Alias Commands')}__**

                ${membershipRoleDocs
                  .map((membershipRoleDoc) => {
                    return `- \`/${membershipRoleDoc.config.aliasCommandName}\`: ${t('verify_command.description_1')} ${membershipRoleDoc.youtube.profile.title} ${t('verify_command.description_2')}`;
                  })
                  .join('\n')}
              ` +
              '\n'
            : ''
        }
        **__${t('common.User Commands')}__**

        ${Object.entries(chatInputCommandMap)
          .filter(
            ([_name, command]) => command.moderatorOnly === false && command.devTeamOnly === false,
          )
          .map(([name]) => {
            const originalName = name.replace(/-/g, '_');
            const prefix = `- \`/${t(`${originalName}_command.name` as TranslationKey)}\`:`;
            if (originalName === 'verify') {
              return `${prefix} ${t('verify_command.description_1')} YouTube ${t('verify_command.description_2')}`;
            }
            return `${prefix} ${t(`${originalName}_command.description` as TranslationKey)}`;
          })
          .join('\n')}
        
        **__${t('common.Moderator Commands')}__**

        ${Object.entries(chatInputCommandMap)
          .filter(
            ([_name, command]) => command.moderatorOnly === true && command.devTeamOnly === false,
          )
          .map(([name]) => {
            const originalName = name.replace(/-/g, '_');
            const prefix = `- \`/${t(`${originalName}_command.name` as TranslationKey)}\`:`;
            return `${prefix} ${t(`${originalName}_command.description` as TranslationKey)}`;
          })
          .join('\n')}
      `,
    );
  };
}
