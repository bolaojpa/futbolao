
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
import { Bell, Check, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { mockNotifications } from '@/lib/data';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';

export function NotificationsNav() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [isOpen, setIsOpen] = useState(false);
    
    // Mostra apenas as 5 notificações mais recentes no dropdown
    const recentNotifications = notifications.slice(0, 5);
    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };
    
    const handleMarkAllAsRead = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setNotifications(prev => prev.map(n => ({...n, read: true })));
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
        {recentNotifications.length === 0 ? (
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
                    onSelect={(e) => {
                        e.preventDefault(); 
                    }}
                >
                    <Link 
                        href={notification.href} 
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
                        <p className="text-xs text-blue-500 mt-1">{formatDistanceToNow(notification.createdAt, { locale: ptBR, addSuffix: true })}</p>
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
