

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History, Bell, BellOff, Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingRowProps {
    id: string;
    title: string;
    description: string;
    initialChecked?: boolean;
}

const NotificationSettingRow = ({ id, title, description, initialChecked = true }: NotificationSettingRowProps) => {
    // Em um app real, o `useState` seria substituído pela lógica
    // para buscar e salvar essa preferência no banco de dados.
    const [isChecked, setIsChecked] = useState(initialChecked);

    return (
        <div className="flex items-center justify-between space-x-4">
            <div className="flex flex-col space-y-1">
                 <Label htmlFor={id} className="text-base cursor-pointer">
                    {title}
                </Label>
                <p className="text-sm text-muted-foreground">
                    {description}
                </p>
            </div>
            <Switch
                id={id}
                checked={isChecked}
                onCheckedChange={setIsChecked}
                aria-label={`Ativar ou desativar ${title}`}
            />
        </div>
    );
};


export function NotificationSettings() {
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true);
                        setSubscription(sub);
                    }
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, []);

    const handleSubscription = async () => {
        if (loading) return;
        setLoading(true);

        if (isSubscribed) {
            // Unsubscribe
            await subscription?.unsubscribe();
            // TODO: remover subscription do backend
            setIsSubscribed(false);
            setSubscription(null);
            toast({ title: "Notificações Desativadas", description: "Você não receberá mais notificações push." });
        } else {
            // Subscribe
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
            // TODO: enviar subscription para o backend
            setIsSubscribed(true);
            setSubscription(sub);
            toast({ title: "Notificações Ativadas!", description: "Você agora receberá alertas importantes no seu dispositivo." });
        }
        setLoading(false);
    };


    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                    Gerencie como você recebe as comunicações do aplicativo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className='p-4 border rounded-lg space-y-2'>
                    <h3 className="font-semibold">Notificações Push</h3>
                    <p className="text-sm text-muted-foreground">
                        Receba alertas em tempo real no seu dispositivo, mesmo com o aplicativo fechado.
                    </p>
                    <Button onClick={handleSubscription} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />)}
                        {isSubscribed ? 'Desativar Notificações Push' : 'Ativar Notificações Push'}
                    </Button>
                </div>

                <div className='p-4 border rounded-lg space-y-4'>
                     <h3 className="font-semibold">Tipos de Notificação (Em Breve)</h3>
                    <NotificationSettingRow
                        id="match-reminders"
                        title="Lembretes de Partidas"
                        description="Receba um alerta 2h antes de uma partida se você ainda não palpitou."
                    />
                    <Separator />
                    <NotificationSettingRow
                        id="performance-updates"
                        title="Atualizações de Desempenho"
                        description="Seja notificado sobre seus pontos e mudanças no ranking após as rodadas."
                    />
                    <Separator />
                    <NotificationSettingRow
                        id="news-and-updates"
                        title="Comunicados e Novidades"
                        description="Receba anúncios do admin, informações sobre novos campeonatos e funcionalidades."
                    />
                </div>
            </CardContent>
            <CardFooter className='border-t pt-6'>
                <div className='w-full flex items-center justify-between'>
                    <div>
                        <h3 className='font-semibold'>Histórico de Notificações</h3>
                        <p className='text-sm text-muted-foreground'>Veja todas as notificações que você já recebeu.</p>
                    </div>
                     <Button asChild variant="outline">
                        <Link href="/dashboard/notifications">
                            <History className="mr-2 h-4 w-4" />
                            Ver Histórico
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
