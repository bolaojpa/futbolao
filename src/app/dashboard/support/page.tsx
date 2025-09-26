
'use client';

import { SupportForm } from '@/components/support/support-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { LifeBuoy, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import type { SupportMessage } from '@/lib/types';
import { getSupportMessagesForUser, markSupportRepliesAsRead } from '@/lib/firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const FormattedDate = ({ date }: { date: any }) => {
    if (!date) return null;
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export default function SupportPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchMessages = async () => {
            setLoading(true);
            const userMessages = await getSupportMessagesForUser(user.id);
            setMessages(userMessages);
            setLoading(false);
        };

        fetchMessages();
    }, [user]);

    const handleAccordionOpen = async (messageId: string, hasUnread: boolean) => {
        if (hasUnread) {
            await markSupportRepliesAsRead(messageId);
            // Re-fetch or update state locally to reflect the change
            const updatedMessages = messages.map(msg => 
                msg.id === messageId ? { ...msg, hasUnreadAdminReply: false } : msg
            );
            setMessages(updatedMessages);
        }
    };
    
    const activeConversations = messages.filter(m => !m.isArchived);

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4 mb-8">
                 <LifeBuoy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Suporte</h1>
                    <p className="text-muted-foreground">
                        Precisa de ajuda ou tem alguma sugestão? Envie uma mensagem para nossa equipe.
                    </p>
                </div>
            </div>

            {activeConversations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MessageSquare /> Conversas em Aberto</CardTitle>
                        <CardDescription>Veja o histórico de suas conversas com o suporte.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="animate-spin"/>
                            </div>
                        ) : (
                            <Accordion type="multiple">
                                {activeConversations.map(msg => (
                                    <AccordionItem value={msg.id} key={msg.id} onOpenChange={() => handleAccordionOpen(msg.id, msg.hasUnreadAdminReply)}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between items-center w-full pr-4">
                                                <p className="truncate">Sua solicitação de <FormattedDate date={msg.createdAt} /></p>
                                                {msg.hasUnreadAdminReply && <Badge>Nova Resposta</Badge>}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4 p-4">
                                            <div className="bg-muted p-3 rounded-lg">
                                                <p className="font-semibold text-sm">Sua Mensagem:</p>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                            </div>
                                            {msg.replies?.map(reply => (
                                                 <div key={reply.id} className="bg-primary/10 p-3 rounded-lg">
                                                     <p className="font-semibold text-sm text-primary">Resposta do Suporte ({reply.authorName}):</p>
                                                     <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                                                     <p className="text-xs text-right text-muted-foreground mt-2"><FormattedDate date={reply.createdAt} /></p>
                                                 </div>
                                            ))}
                                            {!msg.replies && (
                                                <p className="text-sm text-center text-muted-foreground py-2">A equipe de suporte ainda não respondeu.</p>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            )}
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Enviar Nova Mensagem</CardTitle>
                    <CardDescription>
                        Sua mensagem será enviada diretamente para um administrador. Responderemos o mais breve possível.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SupportForm />
                </CardContent>
            </Card>

        </div>
    );
}
