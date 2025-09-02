
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Send, Eye, Users, User, Bell, AlertTriangle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockEmergencyMessage, mockUsers, mockNotifications, mockLogs, mockUser } from '@/lib/data';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


type EmergencyMessage = typeof mockEmergencyMessage;

export default function AdminMessagingPage() {
    const { toast } = useToast();
    const [messageData, setMessageData] = useState<EmergencyMessage>({ ...mockEmergencyMessage, targetUserIds: ['all'] });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [userSearch, setUserSearch] = useState("");

    const handleUserSelect = (userId: string) => {
        setSelectedUsers(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(userId)) {
                newSelection.delete(userId);
            } else {
                newSelection.add(userId);
            }
            return newSelection;
        });
    };

    const availableUsers = useMemo(() => {
        return mockUsers
        .filter(user => user.status === 'ativo' && user.funcao !== 'admin')
        .filter(user => user.apelido.toLowerCase().includes(userSearch.toLowerCase()) || user.nome.toLowerCase().includes(userSearch.toLowerCase()))
        .sort((a, b) => a.apelido.localeCompare(b.apelido));
    }, [userSearch]);

    const handleSave = () => {
        let finalTargets: string[] = [];
        let targetDescription = 'todos os usuários';

        if (targetType === 'all') {
            finalTargets = ['all'];
        } else if (selectedUsers.size > 0) {
            finalTargets = Array.from(selectedUsers);
            targetDescription = `${selectedUsers.size} usuário(s) específico(s)`;
        } else {
            toast({
                title: "Nenhum Destinatário Selecionado",
                description: "Por favor, selecione ao menos um usuário específico para enviar a mensagem.",
                variant: "destructive",
            });
            return;
        }

        const finalMessageData: EmergencyMessage = {
            ...messageData,
            targetUserIds: finalTargets,
        };
        
        if (finalMessageData.type === 'urgent') {
            Object.assign(mockEmergencyMessage, finalMessageData);
             toast({
                title: "Mensagem Urgente Ativada",
                description: `A mensagem "${finalMessageData.title}" aparecerá como um pop-up para ${targetDescription}.`,
            });
        } else {
             // Simula o envio de notificação para múltiplos usuários
            finalTargets.forEach(userId => {
                const targetUser = mockUsers.find(u => u.id === userId);
                const notificationTitle = finalMessageData.title;
                const notificationMessage = `Mensagem do Admin: ${finalMessageData.message.substring(0, 50)}...`;

                 mockNotifications.unshift({
                    id: `notif_${new Date().getTime()}_${userId}`,
                    title: notificationTitle,
                    message: notificationMessage,
                    read: false,
                    createdAt: new Date(),
                    href: '/dashboard/notifications',
                });
            });

             toast({
                title: "Aviso Enviado como Notificação",
                description: `O aviso "${finalMessageData.title}" foi enviado para ${targetDescription}.`,
            });
        }

        mockLogs.unshift({
            id: `log_${new Date().getTime()}`,
            actor: { id: 'user_11', apelido: 'Admin', type: 'admin' },
            action: 'emergency_message',
            details: { 
                title: finalMessageData.title, 
                message: finalMessageData.message, 
                target: targetDescription,
                type: finalMessageData.type
            }
        });

        console.log("Saving message:", finalMessageData);
    };

    return (
        <>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Send className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Painel de Mensagens</h1>
                        <p className="text-muted-foreground">
                            Crie e envie avisos ou recados para os usuários do aplicativo.
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Configurar Mensagem</CardTitle>
                        <CardDescription>
                           Defina o conteúdo, o público e o tipo de mensagem a ser enviada.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <Label htmlFor="active-message" className="text-base">
                                    Ativar Mensagem
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Ative para exibir a mensagem para os usuários selecionados.
                                </p>
                            </div>
                            <Switch
                                id="active-message"
                                checked={messageData.active}
                                onCheckedChange={(checked) => setMessageData(prev => ({...prev, active: checked }))}
                                aria-label="Ativar mensagem"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="message-type">Tipo de Mensagem</Label>
                                <Select value={messageData.type} onValueChange={(value) => setMessageData(prev => ({ ...prev, type: value as 'normal' | 'urgent' }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4" />
                                                <span>Aviso (Notificação Padrão)</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="urgent">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>Urgente (Pop-up na Tela)</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="target-type">Destinatário</Label>
                                <Select value={targetType} onValueChange={(value) => setTargetType(value as 'all' | 'specific')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o destinatário..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" />
                                                <span>Todos os Usuários</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="specific">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>Usuários Específicos</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        {targetType === 'specific' && (
                             <Card className="border-dashed">
                                <CardHeader className="p-4">
                                   <div className="flex items-center justify-between">
                                     <div>
                                        <h3 className="text-md font-medium">Selecionar Usuários</h3>
                                        <p className="text-sm text-muted-foreground">Escolha os destinatários da mensagem.</p>
                                    </div>
                                    <Badge variant="secondary">{selectedUsers.size} selecionado(s)</Badge>
                                   </div>
                                    <div className="relative mt-4">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome ou apelido..."
                                            className="pl-8"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="h-48 w-full rounded-md border">
                                        <div className="p-4 space-y-2">
                                            {availableUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-muted"
                                                >
                                                    <Checkbox
                                                        id={`user-${user.id}`}
                                                        checked={selectedUsers.has(user.id)}
                                                        onCheckedChange={() => handleUserSelect(user.id)}
                                                    />
                                                    <Label htmlFor={`user-${user.id}`} className="font-normal w-full flex items-center gap-3 cursor-pointer">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                            <AvatarFallback>{user.apelido.substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{user.apelido}</span>
                                                            <span className="text-xs text-muted-foreground">{user.nome}</span>
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="message-title">Título da Mensagem</Label>
                            <Input
                                id="message-title"
                                placeholder="Ex: Manutenção Programada"
                                value={messageData.title}
                                onChange={(e) => setMessageData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message-content">Conteúdo da Mensagem</Label>
                            <Textarea
                                id="message-content"
                                placeholder="Descreva o motivo do aviso aqui..."
                                className="min-h-[120px]"
                                value={messageData.message}
                                onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={messageData.type === 'normal'}>
                            <Eye className="mr-2 h-4 w-4" />
                            Pré-visualizar Pop-up
                        </Button>
                        <Button onClick={handleSave}>
                            <Send className="mr-2 h-4 w-4" />
                            Salvar e Enviar
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <EmergencyMessageModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={messageData.title || "Título de Exemplo"}
                message={messageData.message || "Esta é uma mensagem de exemplo para que você possa ver como ela será exibida para o usuário final."}
            />
        </>
    );
}
