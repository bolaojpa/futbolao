
'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { mockEmergencyMessage, mockUser } from '@/lib/data';
import { useState, useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [emergencyMessage, setEmergencyMessage] = useState<{ title: string; message: string; } | null>(null);

  useEffect(() => {
    // Simula a verificação de uma mensagem de emergência ao carregar o app.
    // Em um app real, isso seria uma escuta em tempo real do Firestore.
    if (
      mockEmergencyMessage &&
      mockEmergencyMessage.active &&
      (mockEmergencyMessage.targetUserIds.includes('all') || mockEmergencyMessage.targetUserIds.includes(mockUser.id))
    ) {
      // Verifica se o usuário já viu esta mensagem específica (usando localStorage para simulação)
      const seenMessageId = localStorage.getItem('seenEmergencyMessageId');
      if (seenMessageId !== mockEmergencyMessage.id) {
        setEmergencyMessage({
          title: mockEmergencyMessage.title,
          message: mockEmergencyMessage.message,
        });
      }
    }
  }, []);

  const handleCloseEmergencyModal = () => {
    // Marca a mensagem como vista para não aparecer novamente (para simulação)
    if (mockEmergencyMessage) {
      localStorage.setItem('seenEmergencyMessageId', mockEmergencyMessage.id);
    }
    setEmergencyMessage(null);
  };


  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 bg-blue-50/50 dark:bg-gray-900/50">
          {children}
        </main>
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
