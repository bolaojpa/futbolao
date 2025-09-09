
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { onSnapshot, collection, query, where, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function NotificationsNav() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.id)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedNotifications = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() // Converte Timestamp para Date
            } as Notification));
            
            // Ordena as notificações no lado do cliente
            fetchedNotifications.sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());

            setNotifications(fetchedNotifications);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    // Mostra apenas as 5 notificações mais recentes no dropdown
    const recentNotifications = notifications.slice(0, 5);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (notificationId: string) => {
        const docRef = doc(db, "notifications", notificationId);
        await writeBatch(db).update(docRef, { read: true }).commit();
    };
    
    const handleMarkAllAsRead = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (unreadCount === 0) return;

        const batch = writeBatch(db);
        notifications.forEach(notification => {
            if (!notification.read) {
                const docRef = doc(db, "notifications", notification.id);
                batch.update(docRef, { read: true });
            }
        });
        
        try {
            await batch.commit();
        } catch (error) {
             toast({ title: "Erro", description: "Não foi possível marcar todas como lidas.", variant: "destructive" });
        }
    }
    
    const handleItemClick = (notificationId: string) => {
        handleMarkAsRead(notificationId);
        setIsOpen(false);
    }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
          )}
          <span className="sr-only">Abrir notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 md:w-96" align="end">
        <DropdownMenuLabel className='flex justify-between items-center'>
            Notificações
             {unreadCount > 0 && (
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleMarkAllAsRead}>
                   Marcar todas como lidas
                </Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
        {loading ? (
             <DropdownMenuItem disabled>
                <div className="py-4 text-center text-sm text-muted-foreground">
                    Carregando...
                </div>
            </DropdownMenuItem>
        ) : recentNotifications.length === 0 ? (
            <DropdownMenuItem disabled>
                <div className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação por aqui.
                </div>
            </DropdownMenuItem>
        ) : (
            recentNotifications.map((notification) => (
                <DropdownMenuItem 
                    key={notification.id} 
                    className="p-0 data-[highlighted]:bg-transparent"
                    onSelect={(e) => e.preventDefault()}
                >
                    <Link 
                        href={notification.href || '#'}
                        className={cn(
                            "block w-full p-2.5 rounded-md transition-colors",
                            !notification.read && "bg-blue-50/50 dark:bg-blue-900/20",
                            "hover:bg-muted/80"
                        )}
                        onClick={() => handleItemClick(notification.id)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-semibold">{notification.title}</p>
                                <p className="text-xs text-muted-foreground">{notification.message}</p>
                            </div>
                            {!notification.read && (
                               <div className="h-2 w-2 rounded-full bg-primary mt-1.5 ml-2 shrink-0" title="Não lida"></div>
                            )}
                        </div>
                         {notification.createdAt && (
                             <p className="text-xs text-blue-500 mt-1">{formatDistanceToNow(new Date(notification.createdAt as any), { locale: ptBR, addSuffix: true })}</p>
                         )}
                    </Link>
                </DropdownMenuItem>
            ))
        )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-0 data-[highlighted]:bg-transparent">
             <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center gap-2 p-2 rounded-md text-sm text-primary hover:bg-muted transition-colors">
                Ver todas as notificações
                <ArrowRight className="h-4 w-4" />
            </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
