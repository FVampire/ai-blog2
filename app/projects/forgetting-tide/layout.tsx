import type { ReactNode } from 'react';

import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import TideFrame from './TideFrame';
import styles from './forgetting-tide.module.css';

export default function ForgettingTideLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <Header />
      <TideFrame>{children}</TideFrame>
      <Footer />
    </div>
  );
}
