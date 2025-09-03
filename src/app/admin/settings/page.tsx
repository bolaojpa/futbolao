
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Settings, Shield, Trash2, ToggleLeft, ToggleRight, UserPlus, Percent, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [autoDeleteLogs, setAutoDeleteLogs] = useState(false);
    const [allowRegistrations, setAllowRegistrations] = useState(true);
    const [defaultExactScore, setDefaultExactScore] = useState('10');
    const [defaultSituationScore, setDefaultSituationScore] = useState('5');

    const handleSaveSettings = () => {
        // Em uma aplicação real, estes dados seriam salvos no Firestore
        console.log({
            autoDeleteLogs,
            allowRegistrations,
            defaultExactScore,
            defaultSituationScore,
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
                        <CardTitle>Configurações Gerais do Bolão</CardTitle>
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
                     <div className="rounded-lg border p-4 space-y-4">
                         <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                                <Percent className="w-4 h-4"/>
                                Pontuação Padrão para Campeonatos
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Valores que serão pré-preenchidos ao criar um novo campeonato.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="default-exact-score">Placar Exato (Bucha)</Label>
                                <Input
                                    id="default-exact-score"
                                    type="number"
                                    value={defaultExactScore}
                                    onChange={(e) => setDefaultExactScore(e.target.value)}
                                />
                            </div>
                             <div>
                                <Label htmlFor="default-situation-score">Acerto de Situação</Label>
                                <Input
                                    id="default-situation-score"
                                    type="number"
                                    value={defaultSituationScore}
                                    onChange={(e) => setDefaultSituationScore(e.target.value)}
                                />
                            </div>
                        </div>
                     </div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSaveSettings}>
                        <Save className="mr-2 h-4 w-4"/>
                        Salvar Configurações Gerais
                    </Button>
                </CardFooter>
            </Card>

            <Card className="max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        <CardTitle>Gerenciamento de Logs</CardTitle>
                    </div>
                    <CardDescription>
                        Defina a política de retenção para os logs de atividades do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-delete-logs" className="text-base">
                                Limpeza Automática de Logs
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Se ativado, logs com mais de 30 dias serão excluídos automaticamente.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                             <ToggleLeft className={`h-5 w-5 transition-colors ${!autoDeleteLogs ? 'text-primary' : 'text-muted-foreground'}`} />
                                <Switch
                                id="auto-delete-logs"
                                checked={autoDeleteLogs}
                                onCheckedChange={setAutoDeleteLogs}
                                aria-label="Ativar limpeza automática de logs"
                                />
                             <ToggleRight className={`h-5 w-5 transition-colors ${autoDeleteLogs ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                    </div>
                     <p className="text-xs text-muted-foreground mt-4 p-2">
                        Atualmente, a limpeza automática está <strong>{autoDeleteLogs ? 'ativada' : 'desativada'}</strong>. Quando desativada, os logs devem ser removidos manually na página de Logs de Atividades.
                    </p>
                </CardContent>
            </Card>

        </div>
    );
}
