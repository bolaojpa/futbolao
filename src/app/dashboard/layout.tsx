
'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SparkleAnimation } from '@/components/shared/sparkle-animation';

function ToastListener() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'toast_notifications'),
      where('userId', '==', user.id),
      where('createdAt', '>', Timestamp.now()) // Busca apenas notificações futuras/novas
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          toast({
            duration: 10000,
            description: (
              <div className="relative w-full h-full text-center">
                <div className="relative z-10">
                  <h3 className="text-base font-semibold text-foreground">{data.title}</h3>
                  <p className="text-sm text-foreground/90">{data.message}</p>
                </div>
                <SparkleAnimation />
              </div>
            ),
          });
          // Deleta a notificação após exibí-la para não mostrar de novo
          deleteDoc(doc(db, 'toast_notifications', change.doc.id));
        }
      });
    });

    return () => unsubscribe();
  }, [user, toast]);

  return null; // Este componente não renderiza nada
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [emergencyMessage, setEmergencyMessage] = useState<{ title: string; message: string; } | null>(null);

  // Esta lógica será atualizada posteriormente para buscar do Firestore
  useEffect(() => {
    // Exemplo de como poderia funcionar no futuro
    // if (fetchedMessage.active && isUserInTarget(fetchedMessage.targetUserIds)) {
    //   setEmergencyMessage(fetchedMessage);
    // }
  }, []);

  const handleCloseEmergencyModal = () => {
    setEmergencyMessage(null);
  };


  return (
    <AuthProvider>
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
        <ToastListener />
      </SidebarProvider>
    </AuthProvider>
  );
}
