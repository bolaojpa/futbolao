
'use client';

import { useState } from 'react';
import { mockNotifications } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, read: true })));
    }

    return (
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
                    <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Marcar todas como lidas
                    </Button>
                </CardHeader>
                <CardContent>
                    {notifications.length > 0 ? (
                        <ul className="space-y-2">
                            {notifications.map(notification => (
                                <li key={notification.id}>
                                    <Link href={notification.href} className={cn(
                                        "block w-full p-4 border rounded-lg transition-colors hover:bg-muted/80",
                                        !notification.read && "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className={cn("font-semibold", !notification.read && "text-primary")}>{notification.title}</p>
                                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 ml-4" title="Não lida"></div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {formatDistanceToNow(notification.createdAt, { locale: ptBR, addSuffix: true })}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-10 text-muted-foreground">
                            <Inbox className="mx-auto h-12 w-12" />
                            <p className="mt-4">Nenhuma notificação encontrada.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
