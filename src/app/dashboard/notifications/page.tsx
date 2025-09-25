

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import type { Notification, EmergencyMessage } from '@/lib/types';
import { onSnapshot, collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { NotificationDetailsModal } from '@/components/shared/notification-details-modal';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 10;

// Componente para evitar erro de hidratação com datas relativas
const TimeAgo = ({ date }: { date: Date }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        setTimeAgo(formatDistanceToNow(date, { locale: ptBR, addSuffix: true }));
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
    const [currentPage, setCurrentPage] = useState(1);
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
                createdAt: doc.data().createdAt?.toDate() // Converte Timestamp para Date
            } as Notification));

            // Ordena as notificações no lado do cliente, com segurança
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
        unreadNotifs.forEach(notif => {
            const notifRef = doc(db, 'notifications', notif.id);
            batch.update(notifRef, { read: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Tudo lido!', description: 'Todas as notificações foram marcadas como lidas.' });
        } catch (error) {
            toast({ title: 'Erro', description: 'Não foi possível marcar as notificações como lidas.', variant: 'destructive' });
        }
    }
    
    const handleNotificationClick = (notification: Notification) => {
        // Se a notificação tiver um link de destino válido, navega para ele.
        if (notification.href && notification.href !== '#') {
            router.push(notification.href);
            return;
        }
        
        // Para todas as outras (incluindo as urgentes ou avisos padrão), abre o modal.
        setNotificationToDisplay(notification);
    }

    // Lógica de Paginação
    const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
    const paginatedNotifications = notifications.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Minhas Notificações</h1>
                    <p className="text-muted-foreground">
                        Histórico de todas as comunicações recebidas.
                    </p>
                </div>
            </div>

            <Card className="max-w-4xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Histórico</CardTitle>
                     {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Marcar todas como lidas ({unreadCount})
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="text-center py-10 text-muted-foreground">Carregando...</div>
                    ) : paginatedNotifications.length > 0 ? (
                        <ul className="space-y-2">
                            {paginatedNotifications.map(notification => (
                                <li key={notification.id}>
                                    <button 
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                        "block w-full text-left p-4 border rounded-lg transition-colors hover:bg-muted/80",
                                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                        notification.type === 'urgent' && !notification.read && "border-destructive/50 bg-destructive/10 dark:bg-destructive/20",
                                        notification.type === 'urgent' && notification.read && "border-destructive/20 dark:border-destructive/40"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {notification.type === 'urgent' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                                <div>
                                                    <p className={cn("font-semibold", !notification.read && "text-primary", notification.type === 'urgent' && "text-destructive")}>{notification.title}</p>
                                                    <p className="text-sm text-muted-foreground truncate max-w-lg">{notification.message}</p>
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 ml-4" title="Não lida"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 pl-8">
                                            {notification.createdAt && <TimeAgo date={notification.createdAt as Date} />}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Inbox className="mx-auto h-12 w-12" />
                            <h3 className="mt-4 font-semibold text-lg">Caixa de Entrada Vazia</h3>
                            <p className="text-sm">Você não tem nenhuma notificação no momento.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                    <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button 
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
        {notificationToDisplay && (
            <NotificationDetailsModal
                isOpen={!!notificationToDisplay}
                onClose={() => setNotificationToDisplay(null)}
                notification={notificationToDisplay.originalMessage || notificationToDisplay}
            />
        )}
        </>
    );
}
