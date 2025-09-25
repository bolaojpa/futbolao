
'use client';

import { AppSidebar } from '@/components/shared/app-sidebar';
import { Header } from '@/components/shared/header';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { onSnapshot, collection, query, where, Timestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SparkleAnimation } from '@/components/shared/sparkle-animation';
import type { EmergencyMessage } from '@/lib/types';

function ToastListener() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Consulta simplificada para evitar a necessidade de um índice composto.
    // A filtragem de notificações "novas" é feita no lado do cliente.
    const q = query(
      collection(db, 'toast_notifications'),
      where('userId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Verifica se a notificação é nova para evitar re-exibir toasts antigos no caso de re-conexão
        if (change.type === 'added' && change.doc.data().createdAt?.toMillis() > Date.now() - 5000) { // Tolerância de 5 segundos
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


function UrgentMessageListener() {
    const { user } = useAuth();
    const [emergencyMessage, setEmergencyMessage] = useState<EmergencyMessage | null>(null);

    useEffect(() => {
        if (!user) return;

        const urgentMessageRef = doc(db, 'system_messages', 'urgent');
        const unsubscribe = onSnapshot(urgentMessageRef, (doc) => {
            if (doc.exists()) {
                const message = doc.data() as EmergencyMessage;
                const isTarget = message.targetUserIds.includes('all') || message.targetUserIds.includes(user.id);
                if (message.active && isTarget) {
                    setEmergencyMessage(message);
                } else {
                    setEmergencyMessage(null);
                }
            } else {
                setEmergencyMessage(null);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleCloseEmergencyModal = () => {
        setEmergencyMessage(null);
    };

     if (!emergencyMessage) {
        return null;
    }

    return (
        <EmergencyMessageModal
            isOpen={!!emergencyMessage}
            onClose={handleCloseEmergencyModal}
            title={emergencyMessage.title}
            message={emergencyMessage.message}
        />
    );
}


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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
        <UrgentMessageListener />
        <ToastListener />
      </SidebarProvider>
    </AuthProvider>
  );
}
