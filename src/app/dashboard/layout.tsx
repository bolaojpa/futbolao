import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-blue-50/50 dark:bg-gray-900/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
