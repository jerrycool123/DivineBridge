import {
  GuildCollection,
  MembershipRoleCollection,
  MembershipRoleDoc,
  YouTubeChannelDoc,
} from '@divine-bridge/common';
import { ApplicationCommandRegistries, container } from '@sapphire/framework';
import dayjs from 'dayjs';
import { Guild, GuildTextBasedChannel, PermissionFlagsBits } from 'discord.js';

import { Fetchers } from './fetchers.js';

export namespace Validators {
  export const isValidLogChannel = async (
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
    const { user: botUser } = container.client;

    const logChannel = await Fetchers.fetchGuildChannel(guild, logChannelId);
    if (botUser === null) {
      return {
        success: false,
        error: 'Service is temporarily unavailable.',
      };
    } else if (logChannel === null) {
      return {
        success: false,
        error: `The bot can't find the log channel or doesn't have enough permission to view it.`,
      };
    } else if (!logChannel.isTextBased()) {
      return {
        success: false,
        error: `The log channel is not a valid text channel.`,
      };
    } else if (
      !(logChannel.permissionsFor(botUser)?.has(PermissionFlagsBits.ViewChannel) ?? false)
    ) {
      return {
        success: false,
        error: `The bot doesn't have enough permission to view the log channel.`,
      };
    } else if (
      !(logChannel.permissionsFor(botUser)?.has(PermissionFlagsBits.SendMessages) ?? false)
    ) {
      return {
        success: false,
        error: `The bot doesn't have enough permission to send messages in the log channel.`,
      };
    }

    return {
      success: true,
      data: logChannel,
    };
  };

  export const isGuildHasLogChannel = async (
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
        error: `The server does not exist in the database.`,
      };
    }

    const logChannelId = guildDoc.config.logChannel;
    if (logChannelId === null) {
      return {
        success: false,
        error: `This server does not have a log channel.`,
      };
    }

    return await isValidLogChannel(guild, logChannelId);
  };

  export const isGuildHasMembershipRole = async (
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
        error: `The role <@&${roleId}> is not a membership role in the server.`,
      };
    } else if (membershipRoleDoc.youtube === null) {
      return {
        success: false,
        error:
          `The associated YouTube channel of the membership role <@&${roleId}> is not found in the database.\n` +
          'This is likely a database inconsistency. Please contact the bot developer to fix this issue.',
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
    const botMember = await Fetchers.fetchBotGuildMember(guild);
    if (botMember === null) {
      return {
        success: false,
        error: 'The bot is not in the server.',
      };
    }

    if (roleId === guild.id) {
      // @everyone
      return {
        success: false,
        error:
          'The bot cannot manipulate @everyone role.\n' +
          'Please try again with another valid role.',
      };
    } else if (botMember.roles.highest.comparePositionTo(roleId) <= 0) {
      return {
        success: false,
        error:
          `Due to the role hierarchy, the bot cannot manage the role <@&${roleId}>.\n` +
          `The bot can only manage a role whose order is lower than that of its highest role <@&${botMember.roles.highest.id}>.`,
      };
    }
    return { success: true };
  };

  export const isValidDateInterval = (
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
        error: `The target date (\`${targetDate.format(
          'YYYY-MM-DD',
        )}\`) must be later than the base date (\`${baseDate.format('YYYY-MM-DD')}\`).`,
      };
    } else if (targetDate.isAfter(timeLimit)) {
      return {
        success: false,
        error:
          'The target date is too far in the future.\n' +
          `The target date (\`${targetDate.format(
            'YYYY-MM-DD',
          )}\`) must not be more than ${limitDays} days after the base date (\`${baseDate.format(
            'YYYY-MM-DD',
          )}\`).`,
      };
    }
    return { success: true };
  };

  export const isAliasAvailable = async (
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
    // ? Ref: https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-naming
    if (/^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u.test(alias) === false) {
      return {
        success: false,
        error:
          `The alias \`${alias}\` is not a valid command name.\n` +
          `Please check the naming rules [here](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-naming).`,
      };
    }

    // Check if the alias is conflicting with the built-in commands
    const builtInCommandNames = Array.from(ApplicationCommandRegistries.registries.keys());
    if (builtInCommandNames.includes(alias)) {
      return {
        success: false,
        error: `The alias \`${alias}\` is already used for a built-in command.`,
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
        error: `The alias \`${alias}\` is already used for the role <@&${membershipRoleDoc._id}> in this server.`,
      };
    }
    return { success: true };
  };
}
