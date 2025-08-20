
'use client';

import { useState, useEffect } from 'react';
import { mockNotifications } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    const [notifications, setNotifications] = useState(mockNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    const [currentPage, setCurrentPage] = useState(1);

    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({...n, read: true })));
    }

    // Lógica de Paginação
    const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
    const paginatedNotifications = notifications.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );

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
                     {notifications.some(n => !n.read) && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Marcar todas como lidas
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {paginatedNotifications.length > 0 ? (
                        <ul className="space-y-2">
                            {paginatedNotifications.map(notification => (
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
                                            <TimeAgo date={notification.createdAt} />
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
    );
}
