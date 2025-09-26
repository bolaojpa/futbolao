
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import type { Notification, Timestamp } from '@/lib/types';
import { onSnapshot, collection, query, where, writeBatch, doc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationDetailsModal } from '@/components/shared/notification-details-modal';
import { markNotificationAsRead } from '@/lib/firebase/firestore';

// Componente para evitar erro de hidratação com datas relativas
const TimeAgo = ({ date }: { date: Date | undefined }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        if (date) {
            setTimeAgo(formatDistanceToNow(date, { locale: ptBR, addSuffix: true }));
        }
    }, [date]);

    if (!timeAgo) {
        return null; // ou um placeholder de carregamento
    }

    return <>{timeAgo}</>;
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [notificationToDisplay, setNotificationToDisplay] = useState<Notification | null>(null);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp)?.toDate(), // Converte Timestamp para Date
                readAt: (doc.data().readAt as Timestamp)?.toDate(), // Converte Timestamp para Date
            } as Notification));

            fetchedNotifications.sort((a, b) => {
                const timeA = a.createdAt ? (a.createdAt as Date).getTime() : 0;
                const timeB = b.createdAt ? (b.createdAt as Date).getTime() : 0;
                return timeB - timeA;
            });

            setNotifications(fetchedNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAllAsRead = async () => {
        if (!user) return;

        const unreadNotifs = notifications.filter(n => !n.read);
        if (unreadNotifs.length === 0) return;

        const batch = writeBatch(db);
        const readTimestamp = serverTimestamp();
        unreadNotifs.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { read: true, readAt: readTimestamp });
        });

        try {
            await batch.commit();
            toast({ title: 'Tudo lido!', description: 'Todas as notificações foram marcadas como lidas.' });
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível marcar as notificações como lidas.', variant: 'destructive' });
        }
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = async (notification: Notification) => {
        // Se tiver link, navega
        if (notification.href && notification.href !== '#') {
            router.push(notification.href);
        } else {
            // Senão, sempre abre o modal
            setNotificationToDisplay(notification);
        }

        // Marca como lida se ainda não estiver e atualiza o estado localmente para refletir a data de leitura
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            setNotificationToDisplay(prev => prev ? { ...prev, read: true, readAt: new Date() } : null);
        }
    };

    return (
        <>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Bell className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-3xl font-bold font-headline">Minhas Notificações</h1>
                            <p className="text-muted-foreground">
                                Histórico de todas as comunicações recebidas.
                            </p>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Marcar todas como lidas ({unreadCount})
                        </Button>
                    )}
                </div>

                <div className="w-full">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Carregando...</div>
                    ) : notifications.length > 0 ? (
                        <ul className="space-y-4">
                            {notifications.map(notification => {
                                const isUrgent = notification.type === 'urgent';
                                const hasLink = notification.href && notification.href !== '#';

                                return (
                                    <li key={notification.id}>
                                        <Card 
                                            className={cn(
                                                "transition-colors cursor-pointer hover:bg-muted/50",
                                                !notification.read && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                                isUrgent && !notification.read && "border-destructive/50 bg-destructive/10 dark:bg-destructive/20",
                                                isUrgent && notification.read && "border-destructive/20 dark:border-destructive/40",
                                            )}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-semibold", !notification.read && "text-primary", isUrgent && "text-destructive")}>{notification.title}</p>
                                                        <p className="text-sm text-muted-foreground break-words line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 ml-4 shrink-0" title="Não lida"></div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        <TimeAgo date={notification.createdAt as Date} />
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </li>
                                )
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-20 text-muted-foreground border rounded-lg">
                            <Inbox className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 font-semibold text-lg">Caixa de Entrada Vazia</h3>
                            <p className="text-sm">Você não tem nenhuma notificação no momento.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {notificationToDisplay && (
                <NotificationDetailsModal
                    isOpen={!!notificationToDisplay}
                    onClose={() => setNotificationToDisplay(null)}
                    notification={notificationToDisplay}
                />
            )}
        </>
    );
}
