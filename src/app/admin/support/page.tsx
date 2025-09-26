
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LifeBuoy, ChevronRight, Inbox, Search, Loader2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { onSnapshot, collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SupportMessage, UserType, SupportReply } from '@/lib/types';
import { addReplyToSupportMessage, markSupportMessageAsReadByAdmin } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Textarea } from '@/components/ui/textarea';

const FormattedDate = ({ dateValue }: { dateValue: Timestamp | Date }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        let date: Date;
        if (dateValue instanceof Timestamp) {
            date = dateValue.toDate();
        } else {
            date = dateValue;
        }

        if (date && !isNaN(date.getTime())) {
            setFormattedDate(format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
        } else {
            setFormattedDate("Data inválida");
        }
    }, [dateValue]);
  
    if (!formattedDate) {
      return <>Carregando...</>; 
    }
  
    return <>{formattedDate}</>;
};

interface Conversation {
    userId: string;
    userApelido: string;
    userFoto: string;
    lastMessage: string;
    lastActivityAt: Timestamp;
    isReadByAdmin: boolean;
    messages: SupportMessage[];
    hasUnreadAdminReply: boolean;
}

export default function AdminSupportPage() {
    const { user: adminUser } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'support_messages'), orderBy('lastActivityAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
            
            const groupedConversations = fetchedMessages.reduce((acc, msg) => {
                if (!acc[msg.userId]) {
                    acc[msg.userId] = [];
                }
                acc[msg.userId].push(msg);
                return acc;
            }, {} as Record<string, SupportMessage[]>);
            
            const conversationList: Conversation[] = Object.values(groupedConversations).map(msgs => {
                const mostRecentMessage = msgs[msgs.length - 1];
                return {
                    userId: mostRecentMessage.userId,
                    userApelido: mostRecentMessage.userApelido,
                    userFoto: mostRecentMessage.userFoto,
                    lastMessage: mostRecentMessage.message,
                    lastActivityAt: mostRecentMessage.lastActivityAt!,
                    isReadByAdmin: msgs.every(m => m.isReadByAdmin),
                    messages: msgs,
                    hasUnreadAdminReply: msgs.some(m => m.hasUnreadAdminReply),
                };
            }).sort((a, b) => b.lastActivityAt.toMillis() - a.lastActivityAt.toMillis());

            setConversations(conversationList);

            if (selectedConversation) {
                const updatedSelected = conversationList.find(c => c.userId === selectedConversation.userId);
                setSelectedConversation(updatedSelected || null);
            }
            
            setLoading(false);
        });
        return () => unsubscribe();
    }, [selectedConversation]);
    
    const filteredConversations = conversations.filter(conv => {
        return conv.userApelido.toLowerCase().includes(searchTerm.toLowerCase()) || 
               conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelectConversation = async (conversation: Conversation) => {
        setSelectedConversation(conversation);
        setReplyText('');
        
        const unreadMessages = conversation.messages.filter(m => !m.isReadByAdmin);
        if (unreadMessages.length > 0) {
            const batch = writeBatch(db);
            unreadMessages.forEach(msg => {
                const msgRef = doc(db, 'support_messages', msg.id);
                batch.update(msgRef, { isReadByAdmin: true });
            });
            await batch.commit();
        }
    }
    
    const allMessagesInConversation = useMemo(() => {
        if (!selectedConversation) return [];
        return selectedConversation.messages.flatMap(msg => {
            if (!msg.createdAt) return [];
            const userMessage = { type: 'user', data: msg, timestamp: msg.createdAt.toDate() };
            const adminReplies = (msg.replies || [])
                .filter(reply => !!reply.createdAt)
                .map(reply => ({ type: 'admin', data: reply, timestamp: reply.createdAt.toDate() }));
            return [userMessage, ...adminReplies];
        }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [selectedConversation]);


    const handleSendReply = async () => {
        if (!replyText || !selectedConversation || !adminUser) return;
        setIsReplying(true);

        const lastMessageId = selectedConversation.messages[selectedConversation.messages.length - 1].id;

        try {
            await addReplyToSupportMessage(lastMessageId, {
                authorId: adminUser.id,
                authorName: adminUser.apelido,
                message: replyText,
            });
            setReplyText('');
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsReplying(false);
        }
    }
    
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <LifeBuoy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Caixa de Entrada de Suporte</h1>
                    <p className="text-muted-foreground">Visualize e responda às solicitações dos usuários.</p>
                </div>
            </div>

            <Card className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
                {/* Lista de Mensagens */}
                <div className="w-full md:w-1/3 border-b md:border-r md:border-b-0">
                    <div className="p-4 border-b">
                         <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar mensagem ou usuário..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin"/></div>
                    ) : (
                        <ul className="overflow-y-auto h-full p-2">
                            {filteredConversations.length > 0 ? filteredConversations.map(conv => {
                                return (
                                    <li key={conv.userId}>
                                        <button 
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex gap-4 items-start",
                                                selectedConversation?.userId === conv.userId && "bg-muted"
                                            )}
                                            onClick={() => handleSelectConversation(conv)}
                                        >
                                            {!conv.isReadByAdmin && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" title="Não lida"></div>
                                            )}
                                            <div className={cn("flex-1 min-w-0", conv.isReadByAdmin && "pl-5")}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{conv.userApelido}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(conv.lastActivityAt.toDate(), { locale: ptBR, addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conv.lastMessage}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                )
                            }) : (
                                <div className="text-center text-muted-foreground py-10">
                                    <Inbox className="mx-auto h-10 w-10" />
                                    <p className="mt-4 text-sm font-semibold">Caixa de entrada limpa!</p>
                                    <p className="text-sm">Nenhuma mensagem encontrada.</p>
                                </div>
                            )}
                        </ul>
                    )}
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="w-full md:w-2/3 flex flex-col min-w-0">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedConversation.userFoto} alt={selectedConversation.userApelido} />
                                        <AvatarFallback>{selectedConversation.userApelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedConversation.userApelido}</h3>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-4">
                               {allMessagesInConversation.map((item, index) => {
                                    const isUserMessage = item.type === 'user';
                                    const authorName = isUserMessage ? selectedConversation.userApelido : item.data.authorName;
                                    const authorFoto = isUserMessage ? selectedConversation.userFoto : adminUser?.fotoPerfil;
                                    const authorFallback = isUserMessage ? selectedConversation.userApelido.substring(0,2) : (adminUser?.apelido || 'A').substring(0,2);
                                    
                                    return (
                                        <div key={index} className={cn("flex gap-3", !isUserMessage ? "justify-end" : "")}>
                                            {isUserMessage && (
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={authorFoto} />
                                                    <AvatarFallback>{authorFallback}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn("flex-1 max-w-[80%]", !isUserMessage ? "text-right" : "")}>
                                                <div className={cn(
                                                    "p-3 rounded-lg border inline-block",
                                                    !isUserMessage ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-tl-none"
                                                )}>
                                                    <p className="whitespace-pre-wrap break-words text-left">{item.data.message}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{authorName}</p>
                                            </div>
                                            {!isUserMessage && adminUser && (
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage src={authorFoto} />
                                                    <AvatarFallback>{authorFallback}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )
                               })}
                            </div>
                            <CardFooter className="p-4 border-t bg-muted/50">
                                 <div className="flex w-full items-start gap-4">
                                     <Textarea 
                                        placeholder="Digite sua resposta aqui..."
                                        className="flex-1 bg-background"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        disabled={isReplying}
                                     />
                                     <Button onClick={handleSendReply} disabled={!replyText || isReplying}>
                                        {isReplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                        Enviar
                                     </Button>
                                 </div>
                            </CardFooter>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                            {loading ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <div>
                                    <Inbox className="mx-auto h-12 w-12" />
                                    <p className="mt-4 font-semibold">Selecione uma conversa para ler.</p>
                                    <p className="text-sm">{conversations.length > 0 ? "As conversas mais recentes estão no topo." : "A caixa de entrada está vazia."}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
