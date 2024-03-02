'use client';

import { TranslationKey, initI18n, t } from '@divine-bridge/i18n';
import 'client-only';
import { initReactI18next } from 'react-i18next/initReactI18next';

void initI18n({ plugins: [initReactI18next] });

export function useClientTranslation(lng: undefined | string | string[]) {
  return {
    t: (key: TranslationKey) => t(key, lng === undefined ? lng : Array.isArray(lng) ? lng[0] : lng),
  };
}
