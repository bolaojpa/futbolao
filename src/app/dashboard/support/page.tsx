
'use client';

import { LifeBuoy, MessageSquare, Loader2, Send, CornerDownLeft, Inbox } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useRef } from 'react';
import type { SupportMessage, SupportReply } from '@/lib/types';
import { addSupportMessage, markSupportRepliesAsRead } from '@/lib/firebase/firestore';
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const FormattedDate = ({ date }: { date: any }) => {
    if (!date) return null;
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export default function SupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const q = query(
            collection(db, 'support_messages'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const userMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
            setMessages(userMessages);
            setLoading(false);
            
            // Marca como lida quando a página é carregada
            const unreadMessage = userMessages.find(msg => msg.hasUnreadAdminReply);
            if (unreadMessage) {
                await markSupportRepliesAsRead(unreadMessage.id);
            }
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = async () => {
        if (!user || !newMessage.trim()) return;
        
        setIsSubmitting(true);
        try {
            await addSupportMessage({
                userId: user.id,
                userApelido: user.apelido,
                userFoto: user.fotoPerfil,
                message: newMessage,
            });
            setNewMessage("");
            toast({
                title: "Mensagem Enviada!",
                description: "Sua mensagem foi recebida. Agradecemos o seu contato.",
            });
        } catch (error) {
            toast({ title: "Erro ao Enviar", description: "Não foi possível enviar sua mensagem. Tente novamente.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const allConversationItems = messages.flatMap(msg => {
        if (!msg.createdAt) return []; // Ignora mensagens sem timestamp

        const userMessage = { 
            type: 'user', 
            data: { ...msg, authorId: msg.userId, authorName: msg.userApelido, authorFoto: msg.userFoto, text: msg.message }, 
            timestamp: msg.createdAt.toDate() 
        };

        const adminReplies = (msg.replies || [])
            .filter(reply => !!reply.createdAt) // Garante que a resposta tem um timestamp
            .map(reply => ({ 
                type: 'admin', 
                data: { ...reply, text: reply.message }, 
                timestamp: reply.createdAt.toDate() 
            }));

        return [userMessage, ...adminReplies];
    }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                 <LifeBuoy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Suporte</h1>
                    <p className="text-muted-foreground">
                        Converse com nossa equipe.
                    </p>
                </div>
            </div>

            <div className="flex flex-col flex-1 bg-card border rounded-lg shadow-sm h-[calc(100vh-220px)] max-h-[800px]">
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {loading ? (
                         <div className="flex h-full items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : allConversationItems.length > 0 ? (
                        allConversationItems.map((item, index) => {
                            const isUserMessage = item.type === 'user';
                            const author = isUserMessage ? user : { apelido: 'Admin', fotoPerfil: '/logo.svg' }; // Use a generic admin avatar

                            return (
                                <div key={index} className={cn("flex items-end gap-3", isUserMessage ? "justify-end" : "justify-start")}>
                                     {!isUserMessage && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src="/logo-admin.png" />
                                            <AvatarFallback>A</AvatarFallback>
                                        </Avatar>
                                     )}
                                     <div className={cn(
                                         "max-w-xs md:max-w-md p-3 rounded-lg", 
                                         isUserMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none"
                                     )}>
                                        <p className="text-sm whitespace-pre-wrap">{item.data.text}</p>
                                        <p className={cn("text-xs mt-1", isUserMessage ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                            <FormattedDate date={item.timestamp} />
                                        </p>
                                    </div>
                                    {isUserMessage && user && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.fotoPerfil} />
                                            <AvatarFallback>{user.apelido.substring(0, 2)}</AvatarFallback>
                                        </Avatar>
                                     )}
                                </div>
                            )
                        })
                    ) : (
                         <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                            <Inbox className="w-12 h-12 mb-4"/>
                            <h3 className="text-lg font-semibold">Nenhuma conversa por aqui.</h3>
                            <p className="text-sm">Envie sua primeira mensagem abaixo para iniciar o suporte.</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t bg-background/50">
                    <div className="relative">
                        <Textarea
                            placeholder="Digite sua mensagem aqui..."
                            className="pr-20"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            disabled={isSubmitting}
                        />
                         <Button 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2" 
                            onClick={handleSubmit} 
                            disabled={!newMessage.trim() || isSubmitting}
                            aria-label="Enviar mensagem"
                        >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CornerDownLeft className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
