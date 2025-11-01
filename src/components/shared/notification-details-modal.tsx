
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Bell, AlertTriangle, Clock, Calendar } from 'lucide-react';
import type { Notification } from "@/lib/types";
import { Badge } from "../ui/badge";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

const FormattedDate = ({ date }: { date: any }) => {
    if (!date) return <span className="italic">Ainda não lida</span>;
    // Converte de Timestamp do Firebase se necessário
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    if (!isValid(dateObj)) return <span className="italic">Data inválida</span>;

    return format(dateObj, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
}

export function NotificationDetailsModal({ isOpen, onClose, notification }: NotificationDetailsModalProps) {
    if (!notification) {
        return null;
    }

    const isUrgent = notification.type === 'urgent';
    // Se for urgente e tiver a mensagem original (do popup), use-a. Senão, use a própria notificação.
    const displayData = isUrgent && notification.originalMessage ? notification.originalMessage : notification;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                     <div className="mb-4">
                        <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="capitalize">
                            {isUrgent ? (
                                <AlertTriangle className="mr-1.5 h-3 w-3" />
                            ) : (
                                <Bell className="mr-1.5 h-3 w-3" />
                            )}
                            {notification.type === 'normal' ? 'Aviso' : 'Urgente'}
                        </Badge>
                     </div>
                    <DialogTitle className="text-left text-xl font-headline">{displayData.title}</DialogTitle>
                    <DialogDescription className="text-left text-base py-2 whitespace-pre-wrap">
                        {displayData.message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start flex-col items-start gap-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <strong>Enviada em:</strong> 
                        <FormattedDate date={notification.createdAt} />
                    </div>
                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <strong>Lida em:</strong> 
                        <FormattedDate date={notification.readAt} />
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
