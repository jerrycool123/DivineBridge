import { TranslationKey, defaultLocale, supportedLocales, t } from '@divine-bridge/i18n';
import {
  SharedNameAndDescription,
  SlashCommandAttachmentOption,
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandNumberOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
} from 'discord.js';

declare module 'discord.js' {
  interface I18nHelper {
    setI18nName(key: TranslationKey): this;
    setI18nDescription(key: TranslationKey): this;
  }

  interface SharedNameAndDescription extends I18nHelper {}
}

function setI18nName<T extends SharedNameAndDescription>(this: T, key: TranslationKey) {
  return this.setName(t(key, defaultLocale)).setNameLocalizations(
    supportedLocales.reduce(
      (acc, locale) => (locale === defaultLocale ? acc : { ...acc, [locale]: t(key, locale) }),
      {},
    ),
  );
}

function setI18nDescription<T extends SharedNameAndDescription>(this: T, key: TranslationKey) {
  return this.setDescription(t(key, defaultLocale)).setDescriptionLocalizations(
    supportedLocales.reduce(
      (acc, locale) => (locale === defaultLocale ? acc : { ...acc, [locale]: t(key, locale) }),
      {},
    ),
  );
}

SlashCommandBuilder.prototype.setI18nName = setI18nName;
SlashCommandBuilder.prototype.setI18nDescription = setI18nDescription;

SlashCommandAttachmentOption.prototype.setI18nName = setI18nName;
SlashCommandAttachmentOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandBooleanOption.prototype.setI18nName = setI18nName;
SlashCommandBooleanOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandChannelOption.prototype.setI18nName = setI18nName;
SlashCommandChannelOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandIntegerOption.prototype.setI18nName = setI18nName;
SlashCommandIntegerOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandMentionableOption.prototype.setI18nName = setI18nName;
SlashCommandMentionableOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandNumberOption.prototype.setI18nName = setI18nName;
SlashCommandNumberOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandRoleOption.prototype.setI18nName = setI18nName;
SlashCommandRoleOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandStringOption.prototype.setI18nName = setI18nName;
SlashCommandStringOption.prototype.setI18nDescription = setI18nDescription;

SlashCommandUserOption.prototype.setI18nName = setI18nName;
SlashCommandUserOption.prototype.setI18nDescription = setI18nDescription;
