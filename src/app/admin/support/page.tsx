
'use client';

import { useState, useEffect } from 'react';
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

export default function AdminSupportPage() {
    const { user: adminUser } = useAuth();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [replyText, setReplyText] = useState('');
    const [isReplying, setIsReplying] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'support_messages'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportMessage));
            setMessages(fetchedMessages);
            if (fetchedMessages.length > 0 && !selectedMessage) {
                handleSelectMessage(fetchedMessages[0]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredMessages = messages.filter(msg => {
        return msg.userApelido.toLowerCase().includes(searchTerm.toLowerCase()) || 
               msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelectMessage = async (message: SupportMessage) => {
        setSelectedMessage(message);
        setReplyText('');
        
        const userRef = doc(db, 'users', message.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setSelectedUser(userSnap.data() as UserType);
        } else {
            setSelectedUser(null);
        }

        if (!message.isReadByAdmin) {
           await markSupportMessageAsReadByAdmin(message.id);
        }
    }
    
    useEffect(() => {
        if (!selectedMessage && filteredMessages.length > 0) {
            handleSelectMessage(filteredMessages[0]);
        }
        if (filteredMessages.length === 0) {
            setSelectedMessage(null);
            setSelectedUser(null);
        }
    }, [filteredMessages, selectedMessage]);

    const handleSendReply = async () => {
        if (!replyText || !selectedMessage || !adminUser) return;
        setIsReplying(true);

        try {
            await addReplyToSupportMessage(selectedMessage.id, {
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
                            {filteredMessages.length > 0 ? filteredMessages.map(msg => {
                                return (
                                    <li key={msg.id}>
                                        <button 
                                            className={cn(
                                                "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex gap-4 items-start",
                                                selectedMessage?.id === msg.id && "bg-muted"
                                            )}
                                            onClick={() => handleSelectMessage(msg)}
                                        >
                                            {!msg.isReadByAdmin && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" title="Não lida"></div>
                                            )}
                                            <div className={cn("flex-1 min-w-0", msg.isReadByAdmin && "pl-5")}>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold">{msg.userApelido}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(msg.createdAt.toDate(), { locale: ptBR, addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {msg.message}
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
                    {selectedMessage && selectedUser ? (
                        <>
                            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedUser.fotoPerfil} alt={selectedUser.apelido} />
                                        <AvatarFallback>{selectedUser.apelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedUser.apelido}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    <FormattedDate dateValue={selectedMessage.createdAt} />
                                </span>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                {/* Mensagem Original */}
                                <div className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={selectedMessage.userFoto} />
                                        <AvatarFallback>{selectedMessage.userApelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="bg-background p-3 rounded-lg rounded-tl-none border">
                                            <p className="whitespace-pre-wrap break-words">{selectedMessage.message}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{selectedMessage.userApelido}</p>
                                    </div>
                                </div>

                                {/* Respostas */}
                                {selectedMessage.replies?.map(reply => (
                                    <div key={reply.id} className={cn("flex gap-3", reply.authorId === adminUser?.id ? "justify-end" : "")}>
                                        {reply.authorId !== adminUser?.id && (
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={selectedUser.fotoPerfil} />
                                                <AvatarFallback>{selectedUser.apelido.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn("flex-1 max-w-[80%]", reply.authorId === adminUser?.id ? "text-right" : "")}>
                                            <div className={cn(
                                                "p-3 rounded-lg border inline-block",
                                                reply.authorId === adminUser?.id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background rounded-tl-none"
                                            )}>
                                                <p className="whitespace-pre-wrap break-words text-left">{reply.message}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{reply.authorName}</p>
                                        </div>
                                        {reply.authorId === adminUser?.id && adminUser && (
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={adminUser.fotoPerfil} />
                                                <AvatarFallback>{adminUser.apelido.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
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
                                    <p className="mt-4 font-semibold">Selecione uma mensagem para ler.</p>
                                    <p className="text-sm">A caixa de entrada está vazia ou os filtros não retornaram resultados.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
