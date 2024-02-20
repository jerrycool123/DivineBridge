import { PropsWithChildren } from 'react';

import Footer from '../../components/Layout/Footer';
import Navbar from '../../components/Layout/Navbar';

export default function MainLayout({ children }: PropsWithChildren) {
  return (
    <>
      <Navbar />
      <div className="min-vh-100">{children}</div>
      <Footer />
    </>
  );
}
