import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: '260px', flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}