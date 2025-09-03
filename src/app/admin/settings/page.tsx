
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings, Shield, Trash2, UserPlus, Save, Bot, BrainCircuit, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [allowRegistrations, setAllowRegistrations] = useState(true);
    const [enablePerformanceNotifications, setEnablePerformanceNotifications] = useState(true);
    const [enablePredictionConsultation, setEnablePredictionConsultation] = useState(true);

    const handleSaveSettings = () => {
        // Em uma aplicação real, estes dados seriam salvos no Firestore
        console.log({
            allowRegistrations,
            enablePerformanceNotifications,
            enablePredictionConsultation,
        });
        toast({
            title: "Configurações Salvas!",
            description: "As configurações gerais do bolão foram atualizadas com sucesso.",
        })
    };

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Configurações do Administrador</h1>
                    <p className="text-muted-foreground">
                        Gerencie as configurações globais do aplicativo.
                    </p>
                </div>
            </div>

             <Card className="max-w-2xl">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Configurações Gerais</CardTitle>
                    </div>
                    <CardDescription>
                        Ajustes que afetam o funcionamento geral do aplicativo para todos os usuários.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-registrations" className="text-base flex items-center gap-2">
                                <UserPlus className="w-4 h-4"/>
                                Cadastro de Novos Usuários
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Se desativado, impedirá que novos usuários se cadastrem no aplicativo.
                            </p>
                        </div>
                        <Switch
                            id="allow-registrations"
                            checked={allowRegistrations}
                            onCheckedChange={setAllowRegistrations}
                            aria-label="Permitir novos cadastros"
                        />
                    </div>
                </CardContent>
            </Card>
            
            <Card className="max-w-2xl">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <CardTitle>Funcionalidades de IA</CardTitle>
                    </div>
                    <CardDescription>
                        Controle o acesso dos usuários às funcionalidades de Inteligência Artificial.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-performance-notifications" className="text-base flex items-center gap-2">
                                <Bell className="w-4 h-4"/>
                                Notificações de Desempenho (IA)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Envia automaticamente uma mensagem de IA para os usuários após as rodadas.
                            </p>
                        </div>
                        <Switch
                            id="enable-performance-notifications"
                            checked={enablePerformanceNotifications}
                            onCheckedChange={setEnablePerformanceNotifications}
                            aria-label="Ativar notificações de desempenho por IA"
                        />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-prediction-consultation" className="text-base flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4"/>
                                Consulta de IA nos Palpites
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Permite que os usuários consultem a IA para obter sugestões de palpites.
                            </p>
                        </div>
                        <Switch
                            id="enable-prediction-consultation"
                            checked={enablePredictionConsultation}
                            onCheckedChange={setEnablePredictionConsultation}
                            aria-label="Ativar consulta de IA nos palpites"
                        />
                    </div>
                </CardContent>
            </Card>
            
             <div className="max-w-2xl">
                <Button onClick={handleSaveSettings}>
                    <Save className="mr-2 h-4 w-4"/>
                    Salvar Todas as Configurações
                </Button>
            </div>

        </div>
    );
}
