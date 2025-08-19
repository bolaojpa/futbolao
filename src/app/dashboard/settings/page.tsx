
'use client';

import { useState } from 'react';
import { NotificationSettings } from '@/components/settings/notification-settings';
import { ThemeSettings } from '@/components/settings/theme-settings';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { testPerformanceUpdate } from './actions';

export default function SettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleTestNotification = async () => {
        setIsLoading(true);
        const result = await testPerformanceUpdate();

        if ('error' in result) {
            toast({
                title: "Erro no Teste",
                description: result.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: `(Teste) ${result.title}`,
                description: result.message,
                duration: 5000, 
            });
        }
        setIsLoading(false);
    }

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Configurações</h1>
                    <p className="text-muted-foreground">
                        Gerencie as preferências da sua conta e do aplicativo.
                    </p>
                </div>
            </div>
            
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Aparência</CardTitle>
                    <CardDescription>
                        Personalize a aparência do aplicativo. Sua preferência será salva para a próxima visita.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeSettings />
                </CardContent>
            </Card>

            <NotificationSettings />

            <Card className="max-w-2xl border-dashed border-amber-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bot className="text-amber-500" />
                        Testes de Administrador
                    </CardTitle>
                    <CardDescription>
                        Use esta seção para testar funcionalidades que normalmente seriam acionadas pelo painel do administrador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4">
                        <div className='flex-1 mb-4 sm:mb-0'>
                             <h3 className="text-base font-semibold">Notificação de Desempenho</h3>
                            <p className="text-sm text-muted-foreground">
                                Simula o envio de uma notificação de IA para o seu usuário após uma rodada.
                            </p>
                        </div>
                        <Button onClick={handleTestNotification} disabled={isLoading} variant="secondary">
                             {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Bot className="mr-2 h-4 w-4" />
                            )}
                            Testar Notificação
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
