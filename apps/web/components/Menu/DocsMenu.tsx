'use client';

import MenuOutlined from '@ant-design/icons/MenuOutlined';
import Drawer from 'antd/es/drawer';
import FloatButton from 'antd/es/float-button';
import Menu from 'antd/es/menu';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import { useState } from 'react';

import styles from './DocsMenu.module.css';

import { useClientTranslation } from '../../libs/client/i18n';

function InnerDocsMenu({ items, slug }: { items: MenuItemType[]; slug: string }) {
  return (
    <Menu
      rootClassName={`overflow-auto py-3`}
      className={styles.menu}
      style={{ width: 256, height: '100%', backgroundColor: '#2b2d31' }}
      mode="inline"
      selectedKeys={[slug]}
      items={items}
    />
  );
}

export default function DocsMenu({
  items,
  slug,
  language,
}: {
  items: MenuItemType[];
  slug: string;
  language?: string;
}) {
  const { t } = useClientTranslation(language);

  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <>
      <div className={styles.menuWrapper}>
        <InnerDocsMenu items={items} slug={slug} />
      </div>
      <FloatButton
        rootClassName={styles.floatButton}
        icon={<MenuOutlined />}
        onClick={() => setOpenDrawer(true)}
      />
      <Drawer
        className={styles.menuDrawer}
        styles={{ body: { padding: 0 } }}
        width="16rem"
        title={t('web.Document List')}
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        placement="left"
      >
        <InnerDocsMenu items={items} slug={slug} />
      </Drawer>
    </>
  );
}
