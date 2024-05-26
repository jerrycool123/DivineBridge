import { DocsService } from '@divine-bridge/common';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import Link from 'next/link';

import Markdown from '../../../../../components/Markdown';
import DocsMenu from '../../../../../components/Menu/DocsMenu';
import { WithI18nParams } from '../../../../../types/common';

export default async function DocPage({ params }: WithI18nParams<{ params: { doc?: string[] } }>) {
  const { lng, doc = [] } = params;
  const language = lng === undefined ? lng : Array.isArray(lng) ? lng[0] : lng;
  const slug = doc.join('/');
  const docs = DocsService.getDocs(language);

  const items: MenuItemType[] = docs.map((doc) => ({
    key: doc.slug,
    label: <Link href={`/${language}/docs/${doc.slug}`}>{doc.title}</Link>,
  }));
  const targetDoc = docs.find((d) => d.slug === slug) ?? null;
  const content =
    targetDoc !== null ? `# ${targetDoc.title}\n\n${targetDoc.content}` : '# Document not found';

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
