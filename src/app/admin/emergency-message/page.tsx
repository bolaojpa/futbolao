

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MessageSquareWarning, Send, Eye, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockEmergencyMessage } from '@/lib/data';
import { EmergencyMessageModal } from '@/components/shared/emergency-message-modal';

type EmergencyMessage = typeof mockEmergencyMessage;

export default function AdminEmergencyMessagePage() {
    const { toast } = useToast();
    const [messageData, setMessageData] = useState<EmergencyMessage>(mockEmergencyMessage);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const handleSave = () => {
        // Em um app real, isso salvaria os dados no Firestore.
        // Aqui, apenas atualizamos o estado local e mostramos um toast.
        toast({
            title: "Aviso Atualizado",
            description: `O aviso "${messageData.title}" foi salvo com sucesso.`,
        });
        console.log("Saving emergency message:", messageData);
    };

    return (
        <>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <MessageSquareWarning className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Aviso Urgente</h1>
                        <p className="text-muted-foreground">
                            Crie e gerencie uma mensagem de aviso para todos os usuários.
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Configurar Mensagem</CardTitle>
                        <CardDescription>
                            A mensagem aparecerá como um pop-up para os usuários ao acessarem o dashboard. Use com moderação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                             <div className="space-y-0.5">
                                <Label htmlFor="active-message" className="text-base">
                                    Ativar Mensagem de Aviso
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Ative para exibir o aviso para os usuários selecionados.
                                </p>
                            </div>
                            <Switch
                                id="active-message"
                                checked={messageData.active}
                                onCheckedChange={(checked) => setMessageData(prev => ({...prev, active: checked }))}
                                aria-label="Ativar mensagem de aviso"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="message-title">Título do Aviso</Label>
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
                         <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                             <Info className="h-5 w-5 shrink-0"/>
                            <p className="text-xs">
                                Atualmente, a mensagem de aviso é enviada para <strong>todos os usuários</strong>. Funcionalidades de segmentação de público serão adicionadas no futuro.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                         <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Pré-visualizar
                        </Button>
                        <Button onClick={handleSave}>
                            <Send className="mr-2 h-4 w-4" />
                            Salvar e Enviar
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

