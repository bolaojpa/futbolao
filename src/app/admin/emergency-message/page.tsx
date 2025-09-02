

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Send, Eye, Info, Users, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockEmergencyMessage, mockUsers } from '@/lib/data';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import type { UserType } from '@/lib/data';


type EmergencyMessage = typeof mockEmergencyMessage;

export default function AdminMessagingPage() {
    const { toast } = useToast();
    const [messageData, setMessageData] = useState<EmergencyMessage>({ ...mockEmergencyMessage, targetUserIds: ['all'] });
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
    const [specificUser, setSpecificUser] = useState('');

    const userOptions = mockUsers
        .filter(u => u.status === 'ativo')
        .map(u => ({ label: `${u.apelido} (${u.nome})`, value: u.id }));

    const handleSave = () => {
        let finalTargets: string[] = [];
        if (targetType === 'all') {
            finalTargets = ['all'];
        } else if (specificUser) {
            finalTargets = [specificUser];
        } else {
            toast({
                title: "Destinatário Inválido",
                description: "Por favor, selecione um usuário específico para enviar a mensagem.",
                variant: "destructive",
            });
            return;
        }

        const finalMessageData = {
            ...messageData,
            targetUserIds: finalTargets,
        }

        toast({
            title: "Mensagem Salva e Pronta para Envio",
            description: `A mensagem "${finalMessageData.title}" será enviada para ${targetType === 'all' ? 'todos os usuários' : userOptions.find(u => u.value === specificUser)?.label}.`,
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
                            A mensagem aparecerá como um pop-up para os usuários selecionados ao acessarem o dashboard.
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
                                            <span>Usuário Específico</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {targetType === 'specific' && (
                             <div className="space-y-2">
                                <Label htmlFor="specific-user">Selecionar Usuário</Label>
                                 <Combobox
                                    options={userOptions}
                                    value={specificUser}
                                    onChange={setSpecificUser}
                                    placeholder="Selecione um usuário..."
                                    searchPlaceholder="Buscar por nome ou apelido..."
                                    notFoundMessage="Nenhum usuário encontrado."
                                />
                             </div>
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
                         <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Pré-visualizar
                        </Button>
                        <Button onClick={handleSave}>
                            <Send className="mr-2 h-4 w-4" />
                            Salvar e Ativar
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Modal de Pré-visualização */}
            <EmergencyMessageModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                title={messageData.title || "Título de Exemplo"}
                message={messageData.message || "Esta é uma mensagem de exemplo para que você possa ver como ela será exibida para o usuário final."}
            />
        </>
    );
}
