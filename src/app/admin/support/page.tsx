
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockUsers } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LifeBuoy, ChevronRight, Inbox, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Mock de mensagens de suporte para demonstração
const mockSupportMessages = [
    {
        id: 'sup_1',
        userId: 'user_2',
        message: 'Olá, não estou conseguindo alterar meu time do coração no perfil. A opção aparece desabilitada. Podem me ajudar?',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        isRead: false,
    },
    {
        id: 'sup_2',
        userId: 'user_4',
        message: 'Gostaria de sugerir a inclusão de um bolão para a Série B do Brasileirão. Muitos amigos meus participariam!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        isRead: false,
    },
    {
        id: 'sup_3',
        userId: 'user_5',
        message: 'A pontuação do jogo entre Santos e Fluminense parece estar incorreta no meu histórico. O resultado foi 1x0, mas não recebi os pontos de situação. Poderiam verificar?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isRead: true,
    },
     {
        id: 'sup_4',
        userId: 'user_8',
        message: 'Por que eu sou o lanterna?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        isRead: true,
    }
];

type SupportMessage = typeof mockSupportMessages[0];

const FormattedDate = ({ date }: { date: Date }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        setFormattedDate(format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }, [date]);
  
    if (!formattedDate) {
      return null;
    }
  
    return <>{formattedDate}</>;
};

export default function AdminSupportPage() {
    const [messages, setMessages] = useState(mockSupportMessages);
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMessages = messages.filter(msg => {
        const user = mockUsers.find(u => u.id === msg.userId);
        if (!user) return false;
        return user.apelido.toLowerCase().includes(searchTerm.toLowerCase()) || 
               msg.message.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleSelectMessage = (message: SupportMessage) => {
        setSelectedMessage(message);
        // Marca a mensagem como lida ao ser selecionada
        setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isRead: true } : m));
    }
    
    useEffect(() => {
        if (filteredMessages.length > 0 && !selectedMessage) {
            setSelectedMessage(filteredMessages[0]);
        }
        if (filteredMessages.length === 0) {
            setSelectedMessage(null);
        }
    }, [filteredMessages, selectedMessage]);
    
    const selectedMessageUser = mockUsers.find(u => u.id === selectedMessage?.userId);

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
                    <ul className="overflow-y-auto h-full p-2">
                        {filteredMessages.length > 0 ? filteredMessages.map(msg => {
                             const user = mockUsers.find(u => u.id === msg.userId);
                             if (!user) return null;
                            return (
                                <li key={msg.id}>
                                    <button 
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex gap-4 items-start",
                                            selectedMessage?.id === msg.id && "bg-muted"
                                        )}
                                        onClick={() => handleSelectMessage(msg)}
                                    >
                                         {!msg.isRead && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" title="Não lida"></div>
                                        )}
                                        <div className={cn("flex-1 min-w-0", msg.isRead ? "pl-5" : "")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold">{user.apelido}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(msg.createdAt, 'dd/MM')}
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
                </div>

                {/* Conteúdo da Mensagem */}
                <div className="w-full md:w-2/3 flex flex-col min-w-0">
                    {selectedMessage && selectedMessageUser ? (
                        <>
                            <div className="p-4 border-b flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedMessageUser.fotoPerfil} alt={selectedMessageUser.apelido} />
                                        <AvatarFallback>{selectedMessageUser.apelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold">{selectedMessageUser.apelido}</h3>
                                        <p className="text-sm text-muted-foreground">{selectedMessageUser.email}</p>
                                    </div>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    <FormattedDate date={selectedMessage.createdAt} />
                                </span>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto">
                                <p className="whitespace-pre-wrap break-words max-w-prose">{selectedMessage.message}</p>
                            </div>
                            <div className="p-4 border-t bg-muted/50">
                                 <Button>
                                    Responder por E-mail
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                 </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                             <div>
                                <Inbox className="mx-auto h-12 w-12" />
                                <p className="mt-4 font-semibold">Selecione uma mensagem para ler.</p>
                                <p className="text-sm">A caixa de entrada está vazia ou os filtros não retornaram resultados.</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
