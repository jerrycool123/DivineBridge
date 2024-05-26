import {
  GuildCollection,
  MembershipRoleCollection,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { TFunc } from '@divine-bridge/i18n';
import dayjs from 'dayjs';
import dedent from 'dedent';
import {
  Guild,
  GuildBasedChannel,
  GuildMember,
  GuildTextBasedChannel,
  PermissionFlagsBits,
} from 'discord.js';

import { store } from '../structures/store.js';

export namespace Validators {
  export const isValidLogChannel = async (
    t: TFunc,
    guild: Guild,
    logChannelId: string,
  ): Promise<
    | {
        success: true;
        data: GuildTextBasedChannel;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    let botMember: GuildMember | null = null;
    let logChannel: GuildBasedChannel | null = null;
    try {
      botMember = await guild.members.fetchMe();
      logChannel = await guild.channels.fetch(logChannelId);
    } catch (error) {
      // The bot can't find the log channel, ignore the error
    }
    if (botMember === null) {
      return {
        success: false,
        error: t(`server.The bot is not in the server`),
      };
    } else if (logChannel === null) {
      return {
        success: false,
        error: t(
          `server.The bot cant find the log channel or doesnt have enough permission to view it`,
        ),
      };
    } else if (!logChannel.isTextBased()) {
      return {
        success: false,
        error: t(`server.The log channel is not a valid text channel`),
      };
    } else if (
      !(logChannel.permissionsFor(botMember).has(PermissionFlagsBits.ViewChannel) ?? false)
    ) {
      return {
        success: false,
        error: t(`server.The bot doesnt have enough permission to view the log channel`),
      };
    } else if (
      logChannel.permissionsFor(guild.roles.everyone).has(PermissionFlagsBits.ViewChannel)
    ) {
      return {
        success: false,
        error: t(
          `server.The log channel is visible to everyone in the server For security reasons please change the channel to a private channel and then try again`,
        ),
      };
    } else if (
      !logChannel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages) ||
      !logChannel.permissionsFor(botMember).has(PermissionFlagsBits.EmbedLinks)
    ) {
      return {
        success: false,
        error: t(
          `server.The bot doesnt have enough permission to send embed messages in the log channel`,
        ),
      };
    }

    return {
      success: true,
      data: logChannel,
    };
  };

  export const isGuildHasLogChannel = async (
    t: TFunc,
    guild: Guild,
  ): Promise<
    | {
        success: true;
        data: GuildTextBasedChannel;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    const guildDoc = await GuildCollection.findById(guild.id);
    if (guildDoc === null) {
      return {
        success: false,
        error: t(`server.The server does not exist in the database`),
      };
    }

    const logChannelId = guildDoc.config.logChannel;
    if (logChannelId === null) {
      return {
        success: false,
        error: t(`server.This server does not have a log channel`),
      };
    }

    return await isValidLogChannel(t, guild, logChannelId);
  };

  export const isGuildHasMembershipRole = async (
    t: TFunc,
    guildId: string,
    roleId: string,
  ): Promise<
    | {
        success: true;
        data: Omit<MembershipRoleDoc, 'youtube'> & {
          youtube: YouTubeChannelDoc;
        };
      }
    | {
        success: false;
        error: string;
      }
  > => {
    const membershipRoleDoc = await MembershipRoleCollection.findOne({
      _id: roleId,
      guild: guildId,
    }).populate<{
      youtube: YouTubeChannelDoc | null;
    }>('youtube');
    if (membershipRoleDoc === null) {
      return {
        success: false,
        error: `${t('server.The role')} <@&${roleId}> ${t('server.is not a membership role in the server')}`,
      };
    } else if (membershipRoleDoc.youtube === null) {
      return {
        success: false,
        error: dedent`
          ${t('server.The associated YouTube channel of the membership role')} <@&${roleId}> ${t('server.is not found in the database')}
          ${t(
            'server.This is likely a database inconsistency Please contact the bot developer to fix this issue',
          )}
        `,
      };
    }
    return {
      success: true,
      data: membershipRoleDoc as Omit<MembershipRoleDoc, 'youtube'> & {
        youtube: YouTubeChannelDoc;
      },
    };
  };

  export const isManageableRole = async (
    t: TFunc,
    guild: Guild,
    roleId: string,
  ): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    let botMember: GuildMember | null = null;
    try {
      botMember = await guild.members.fetchMe();
    } catch (error) {
      // ignore the error
    }
    if (botMember === null) {
      return {
        success: false,
        error: t('server.The bot is not in the server'),
      };
    }

    if (roleId === guild.id) {
      // @everyone
      return {
        success: false,
        error: t(
          'server.The bot cannot manipulate everyone role Please try again with another valid role',
        ),
      };
    } else if (botMember.roles.highest.comparePositionTo(roleId) <= 0) {
      return {
        success: false,
        error: dedent`
          ${t('server.Due to the role hierarchy the bot cannot manage the role')} <@&${roleId}>
          ${t('server.The bot can only manage a role whose order is lower than that of its highest role')} <@&${botMember.roles.highest.id}>
        `,
      };
    }
    return { success: true };
  };

  export const isValidDateInterval = (
    t: TFunc,
    targetDate: dayjs.Dayjs,
    baseDate: dayjs.Dayjs,
    limitDays = 60,
  ):
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      } => {
    const timeLimit = baseDate.add(limitDays, 'days');

    if (targetDate.isBefore(baseDate)) {
      return {
        success: false,
        error: `${t('server.The target date')} (\`${targetDate.format(
          'YYYY-MM-DD',
        )}\`) ${t('server.must be later than the base date')} (\`${baseDate.format('YYYY-MM-DD')}\`).`,
      };
    } else if (targetDate.isAfter(timeLimit)) {
      return {
        success: false,
        error: dedent`
          ${t('server.The target date is too far in the future')}
          ${t('server.The target date')} (\`${targetDate.format(
            'YYYY-MM-DD',
          )}\`) ${t('server.must not be more than')} ${limitDays} ${t('server.days after the base date')} (\`${baseDate.format(
            'YYYY-MM-DD',
          )}\`)
        `,
      };
    }
    return { success: true };
  };

  export const isAliasAvailable = async (
    t: TFunc,
    guild: Guild,
    alias: string,
  ): Promise<
    | {
        success: true;
      }
    | {
        success: false;
        error: string;
      }
  > => {
    // Check if the alias is a legal command name
    if (
      // ? Ref: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-naming
      !/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u.test(alias) ||
      // ? Ref: https://github.com/discordjs/discord.js/blob/main/packages/builders/src/interactions/slashCommands/Assertions.ts
      !/^[\p{Ll}\p{Lm}\p{Lo}\p{N}\p{sc=Devanagari}\p{sc=Thai}_-]+$/u.test(alias)
    ) {
      return {
        success: false,
        error: dedent`
          ${t('server.The alias')} \`${alias}\` ${t('server.is not a valid command name')}
          ${t('server.Please check the naming rules here')}
        `,
      };
    }

    // Check if the alias is conflicting with the built-in commands
    if (alias in store.bot.chatInputCommandMap) {
      return {
        success: false,
        error: `${t('server.The alias')} \`${alias}\` ${t('server.is already used for a built-in command')}`,
      };
    }

    // Check if the alias is already used in this guild
    const membershipRoleDoc = await MembershipRoleCollection.findOne({
      'guild': guild.id,
      'config.alias': alias,
    });
    if (membershipRoleDoc !== null) {
      return {
        success: false,
        error: `${t('server.The alias')} \`${alias}\` ${t('server.is already used for the role')} <@&${membershipRoleDoc._id}> ${t('server.in this server')}`,
      };
    }
    return { success: true };
  };
}
