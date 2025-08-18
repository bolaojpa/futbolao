
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from 'lucide-react';

interface EmergencyMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function EmergencyMessageModal({ isOpen, onClose, title, message }: EmergencyMessageModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
             <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-2xl font-headline">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base py-2">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction onClick={onClose}>
            Entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
