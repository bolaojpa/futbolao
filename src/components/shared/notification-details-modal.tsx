
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
import { Bell, AlertTriangle } from 'lucide-react';
import type { Notification } from "@/lib/types";

interface NotificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Pick<Notification, 'title' | 'message' | 'type' | 'originalMessage'>;
}

export function NotificationDetailsModal({ isOpen, onClose, notification }: NotificationDetailsModalProps) {
    const isUrgent = notification.type === 'urgent';
    const displayData = notification.originalMessage || notification;
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <div className="mx-auto w-fit mb-4">
                    {isUrgent ? (
                        <div className="bg-destructive/10 p-3 rounded-full">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>
                    ) : (
                        <div className="bg-primary/10 p-3 rounded-full">
                             <Bell className="h-10 w-10 text-primary" />
                        </div>
                    )}
                </div>
                <DialogTitle className="text-center text-2xl font-headline">{displayData.title}</DialogTitle>
                <DialogDescription className="text-center text-base py-2 whitespace-pre-wrap">
                    {displayData.message}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
            <Button onClick={onClose}>
                Fechar
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
