import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import Footer from '../../../components/Layout/Footer';
import Navbar from '../../../components/Layout/Navbar';
import { MainProvider } from '../../../contexts/MainContext';
import { getServerTranslation } from '../../../libs/server/i18n';
import { WithI18nParams } from '../../../types/common';

export async function generateMetadata(props: WithI18nParams): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.lng);

  return {
    description: t('web.meta_description'),
  };
}

export default async function MainLayout({ children }: PropsWithChildren) {
  return (
    <MainProvider>
      <Navbar />
      <div className="min-vh-100">{children}</div>
      <Footer />
    </MainProvider>
  );
}
