
'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockNotifications } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function NotificationsNav() {
    const [notifications, setNotifications] = useState(mockNotifications);
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };
    
    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, read: true })));
    }

  return (
    <DropdownMenu>
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
                <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllAsRead}>
                   Marcar todas como lidas
                </Button>
            )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
            <DropdownMenuItem disabled>
                <div className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação por aqui.
                </div>
            </DropdownMenuItem>
        ) : (
            notifications.map((notification) => (
                <DropdownMenuItem 
                    key={notification.id} 
                    className={cn("flex flex-col items-start gap-1 whitespace-normal", !notification.read && "bg-blue-50/50 dark:bg-blue-900/20")}
                    onSelect={(e) => {
                        e.preventDefault(); // Impede o menu de fechar
                        handleMarkAsRead(notification.id);
                    }}
                >
                     <div className="font-semibold">{notification.title}</div>
                     <p className="text-xs text-muted-foreground">{notification.message}</p>
                     <p className="text-xs text-blue-500">{formatDistanceToNow(notification.createdAt, { locale: ptBR, addSuffix: true })}</p>
                </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
