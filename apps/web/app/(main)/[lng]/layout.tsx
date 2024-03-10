import { Metadata } from 'next';
import { PropsWithChildren } from 'react';

import Footer from '../../../components/Layout/Footer';
import Navbar from '../../../components/Layout/Navbar';
import { MainProvider } from '../../../contexts/MainContext';
import { getServerTranslation } from '../../../libs/server/i18n';
import { WithI18nParams } from '../../../types/common';

export async function generateMetadata({ params }: WithI18nParams): Promise<Metadata> {
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
