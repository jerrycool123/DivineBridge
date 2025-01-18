import { DocsService } from '@divine-bridge/common';
import { defaultLocale, supportedLocales } from '@divine-bridge/i18n';
import { MenuItemType } from 'antd/es/menu/interface';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import Markdown from '../../../../../components/Markdown';
import DocsMenu from '../../../../../components/Menu/DocsMenu';
import { publicEnv } from '../../../../../libs/common/public-env';
import { WithI18nParams } from '../../../../../types/common';

export default async function DocPage(props: WithI18nParams<{ doc?: string[] }>) {
  const params = await props.params;
  const { lng, doc = [] } = params;
  const rawLanguage = lng === undefined ? defaultLocale : Array.isArray(lng) ? lng[0] : lng;
  const language = supportedLocales.includes(rawLanguage as (typeof supportedLocales)[number])
    ? rawLanguage
    : defaultLocale;
  const slug = doc.join('/');
  const docs = DocsService.getDocs(language);

  if (slug.length === 0) {
    return redirect(`/${language}/docs/user-tutorial`);
  }

  const items: MenuItemType[] = docs.map((doc) => ({
    key: doc.slug,
    label: <Link href={`/${language}/docs/${doc.slug}`}>{doc.title}</Link>,
  }));
  const targetDoc = docs.find((d) => d.slug === slug) ?? null;
  let content = '';

  if (targetDoc !== null) {
    if (targetDoc.slug === 'command-list') {
      await fetch(`${publicEnv.NEXT_PUBLIC_WEB_URL}/api/commands/${language}`, {
        next: { revalidate: 60 },
      })
        .then(async (res) => {
          content = await res.text();
        })
        .catch((error: unknown) => {
          console.error(error);
        });
    } else {
      content = `# ${targetDoc.title}\n\n${targetDoc.content}`;
    }
  } else {
    content = '# Document not found';
  }

  return (
    <div className="min-vh-100 d-flex">
      <div className="flex-shrink-0 position-relative">
        <DocsMenu items={items} slug={slug} language={language} />
      </div>
      <div className="flex-grow-1 d-flex justify-content-center">
        <div
          className="flex-grow-1 d-flex flex-column py-5 px-3"
          style={{ color: '#DCDCDC', maxWidth: '50rem' }}
        >
          <Markdown content={content} />
        </div>
      </div>
    </div>
  );
}
