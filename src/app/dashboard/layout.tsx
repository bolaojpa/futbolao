
'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [emergencyMessage, setEmergencyMessage] = useState<{ title: string; message: string; } | null>(null);

  useEffect(() => {
    // A lógica que dependia de 'mockEmergencyMessage' foi removida.
    // Em um app real, isso seria uma escuta em tempo real do Firestore.
    // Por enquanto, não exibiremos nenhuma mensagem de emergência.
  }, []);

  const handleCloseEmergencyModal = () => {
    setEmergencyMessage(null);
  };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 bg-blue-50/50 dark:bg-gray-900/50">
            {children}
          </main>
        </div>
      </div>
       {emergencyMessage && (
        <EmergencyMessageModal
          isOpen={!!emergencyMessage}
          onClose={handleCloseEmergencyModal}
          title={emergencyMessage.title}
          message={emergencyMessage.message}
        />
      )}
    </SidebarProvider>
  );
}
