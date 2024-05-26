import { TFunc } from '@divine-bridge/i18n';
import dedent from 'dedent';
import { RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10';

import { GuildCollection } from '../models/guild.js';
import { DiscordBotAPI } from './discord-bot-api.js';
import type { Logger } from './system-log.js';

export class AppEventLogService {
  public guildOwnerId: string | null = null;
  public logChannelId: string | null = null;
  private guildName: string;

  constructor(
    private readonly t: TFunc,
    private readonly logger: Logger,
    private readonly discordBotApi: DiscordBotAPI,
    private readonly guildId: string,
  ) {
    this.guildName = guildId;
  }

  public async init(): Promise<this> {
    const guildDoc = await GuildCollection.findById(this.guildId);
    if (guildDoc !== null) {
      this.logChannelId = guildDoc.config.logChannel;
      this.guildName = guildDoc.profile.name;
    }
    const guildResult = await this.discordBotApi.fetchGuild(this.guildId);
    if (guildResult.success) {
      this.guildOwnerId = guildResult.guild.owner_id;
    }
    return this;
  }

  public async log(payload: RESTPostAPIChannelMessageJSONBody, notified = true): Promise<boolean> {
    // Add warning if the log is not notified
    const modifiedPayload = { ...payload };
    if (!notified) {
      modifiedPayload.content = dedent`
        ${this.t('common.event_log_not_notified')}
        
        ${modifiedPayload.content ?? ''}
      `;
    }

    // Try to send event log to the log channel
    if (this.logChannelId !== null) {
      const logResult = await this.discordBotApi.createChannelMessage(
        this.logChannelId,
        modifiedPayload,
      );
      if (logResult.success) {
        return true;
      }
    }

    // If the log is failed to send, try to DM the guild owner about the removal
    if (this.guildOwnerId !== null) {
      modifiedPayload.content = dedent`
        > ${this.t('common.event_log_failed_to_send')} \`${this.guildName}\`.
        > ${this.t('common.event_log_failed_to_send_2')} \`/${this.t('set_log_channel_command.name')}\`, ${this.t('common.event_log_failed_to_send_3')}
        
        ${modifiedPayload.content ?? ''}
      `;
      const dmResult = await this.discordBotApi.createDMMessage(this.guildOwnerId, modifiedPayload);
      if (dmResult.success) {
        return true;
      }
    }

    this.logger.error(
      `Failed to send event log to the log channel or DM the guild owner in guild ${this.guildId}.`,
    );
    return false;
  }
}
