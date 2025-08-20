
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { History } from 'lucide-react';
import { Separator } from '../ui/separator';

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
    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                    Escolha quais comunicações você deseja receber e acesse seu histórico.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className='p-4 border rounded-lg space-y-4'>
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
