import i18next, { ThirdPartyModule, t as i18next_t } from 'i18next';

import { defaultLocale, supportedLocales } from './constants.js';
import en_US from './locales/en-US.json';
import zh_TW from './locales/zh-TW.json';

export * from './constants.js';

/* Translation resources */

const resources = {
  'en-US': { translation: en_US },
  'zh-TW': { translation: zh_TW },
};

/* End of translation resources */

export const initI18n = async (args?: { plugins?: ThirdPartyModule[]; debug?: boolean }) => {
  const instance = i18next;
  for (const plugin of args?.plugins ?? []) {
    instance.use(plugin);
  }
  await instance.init({
    lng: defaultLocale,
    fallbackLng: defaultLocale,
    supportedLngs: supportedLocales,
    debug: args?.debug,
    resources,
  });
};

type Extractor<T> = {
  [K in keyof T]: T[K] extends Record<string, string>
    ? K extends string
      ? `${K}.${Extract<keyof T[K], string>}`
      : never
    : never;
}[keyof T];

export type TranslationKey = Extractor<(typeof resources)[typeof defaultLocale]['translation']>;

export type TFunc = {
  (key: TranslationKey): string;
};

export type TLocaleFunc = {
  (key: TranslationKey, locale: string | undefined): string;
};

export const t: TLocaleFunc = (key, locale) => i18next_t(key, { lng: locale });
