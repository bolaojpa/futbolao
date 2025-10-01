
'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Header } from '@/components/shared/header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.funcao !== 'admin' && user.funcao !== 'moderator'))) {
      router.push('/'); 
    }
  }, [user, loading, router]);

  if (loading || !user || (user.funcao !== 'admin' && user.funcao !== 'moderator')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
        <SidebarProvider>
            <div className='flex min-h-screen w-full'>
            <AdminSidebar />
            <div className="flex flex-col w-full">
                <Header /> 
                <main className="flex-1 bg-blue-50/50 dark:bg-gray-900/50">
                {children}
                </main>
            </div>
            </div>
        </SidebarProvider>
    </AdminAuthGuard>
  );
}
