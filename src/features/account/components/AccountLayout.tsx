import type { ReactNode } from 'react';
import AccountNav from './AccountNav';

/** The account shell: title and section links stay while a section loads or fails. */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <section className="section account-page">
      <div className="container-tcar">
        <h1 className="account-page-title">حسابي</h1>

        <div className="account-grid">
          <AccountNav />
          <div className="account-content">{children}</div>
        </div>
      </div>
    </section>
  );
}
