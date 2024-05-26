import { t } from '@divine-bridge/i18n';

export namespace DocsService {
  export const getDocs = (
    locale?: string,
  ): {
    title: string;
    slug: string;
    content: string;
  }[] => [
    {
      title: t('docs.title_user-tutorial', locale),
      slug: 'user-tutorial',
      content: t('docs.user-tutorial', locale),
    },
    {
      title: t('docs.title_moderator-tutorial', locale),
      slug: 'moderator-tutorial',
      content: t('docs.moderator-tutorial', locale),
    },
  ];
}
