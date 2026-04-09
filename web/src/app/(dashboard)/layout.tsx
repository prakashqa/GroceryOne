'use client';

import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { ThemeProvider } from '@/lib/theme/provider';
import { DataHydration } from '@/components/common/DataHydration';
import { SidebarProvider } from '@/hooks/useSidebar';
import '@/lib/i18n/config';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <DataHydration>
        <SidebarProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              <Header />
              <main className="flex-1 overflow-y-auto bg-background dark:bg-background-dark p-4 md:p-6">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </DataHydration>
    </ThemeProvider>
  );
}
