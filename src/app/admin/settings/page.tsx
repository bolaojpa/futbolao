
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function AdminSettingsPage() {
    const [autoDeleteLogs, setAutoDeleteLogs] = useState(false);

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
                        Atualmente, a limpeza automática está <strong>{autoDeleteLogs ? 'ativada' : 'desativada'}</strong>. Quando desativada, os logs devem ser removidos manualmente na página de Logs de Atividades.
                    </p>
                </CardContent>
            </Card>

             <Card className="max-w-2xl">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle>Permissões</CardTitle>
                    </div>
                    <CardDescription>
                        Configurações sobre funções e permissões de usuários (Em breve).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Esta seção permitirá o gerenciamento fino sobre o que cada função (Usuário, Moderador) pode fazer no aplicativo.</p>
                </CardContent>
            </Card>

        </div>
    );
}
