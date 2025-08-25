
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Header } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        {/* A header pode ser reutilizada ou uma específica do admin pode ser criada */}
        <Header /> 
        <main className="flex-1 bg-blue-50/50 dark:bg-gray-900/50">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
