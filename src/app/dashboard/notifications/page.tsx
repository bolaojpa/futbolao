
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import type { Notification } from '@/lib/types';
import { onSnapshot, collection, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Card, CardContent } from '@/components/ui/card';

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

const NOTIFICATION_PREVIEW_LENGTH = 150; // Max characters before "Ver mais"

export default function NotificationsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

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
    
    const handleItemClick = (notification: Notification) => {
        if (notification.href && notification.href !== '#') {
            router.push(notification.href);
        }
    }
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
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
                            const isLongMessage = notification.message.length > NOTIFICATION_PREVIEW_LENGTH;
                            const hasLink = notification.href && notification.href !== '#';
                            
                            return (
                                <li key={notification.id}>
                                    <Collapsible asChild>
                                        <Card className={cn(
                                            "transition-colors",
                                            !notification.read && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                            notification.type === 'urgent' && !notification.read && "border-destructive/50 bg-destructive/10 dark:bg-destructive/20",
                                            notification.type === 'urgent' && notification.read && "border-destructive/20 dark:border-destructive/40"
                                        )}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn("font-semibold", !notification.read && "text-primary", notification.type === 'urgent' && "text-destructive")}>{notification.title}</p>
                                                        <div className="w-full">
                                                          <p className={cn("text-sm text-muted-foreground", !isLongMessage && "line-clamp-2")}>
                                                            {isLongMessage ? `${notification.message.substring(0, NOTIFICATION_PREVIEW_LENGTH)}...` : notification.message}
                                                          </p>
                                                          <CollapsibleContent>
                                                               <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2">{notification.message}</p>
                                                          </CollapsibleContent>
                                                        </div>
                                                    </div>
                                                    {!notification.read && (
                                                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 ml-4 shrink-0" title="Não lida"></div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        <TimeAgo date={notification.createdAt as Date} />
                                                    </p>
                                                    {isLongMessage && !hasLink && (
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="link" size="sm" className="h-auto p-0">
                                                                Ver mais
                                                                <ChevronDown className="h-4 w-4 ml-1 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                    )}
                                                    {hasLink && (
                                                        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => handleItemClick(notification)}>
                                                            Ir para o link
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Collapsible>
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
        </>
    );
}
