

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
import { SparkleAnimation } from '@/components/shared/sparkle-animation';


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
                duration: 10000,
                description: (
                    <div className="relative w-full h-full text-center">
                        <div className="relative z-10">
                            <h3 className="text-base font-semibold text-foreground">{`(Teste) ${result.title}`}</h3>
                            <p className="text-sm text-foreground/90">{result.message}</p>
                        </div>
                        <SparkleAnimation />
                    </div>
                ),
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
            
        </div>
    );
}
