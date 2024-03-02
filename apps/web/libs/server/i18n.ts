import { TranslationKey, initI18n, t } from '@divine-bridge/i18n';

export async function getServerTranslation(lng: undefined | string | string[]) {
  await initI18n();

  return {
    original_t: t,
    t: (key: TranslationKey) => t(key, lng === undefined ? lng : Array.isArray(lng) ? lng[0] : lng),
  };
}
