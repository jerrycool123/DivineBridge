import { PropsWithChildren } from 'react';

import Footer from '../../components/Layout/Footer';
import Navbar from '../../components/Layout/Navbar';
import { MainProvider } from '../../contexts/MainContext';

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <MainProvider>
      <Navbar />
      <div className="min-vh-100">{children}</div>
      <Footer />
    </MainProvider>
  );
}
