"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
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
                    Escolha quais comunicações você deseja receber.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <NotificationSettingRow
                    id="match-reminders"
                    title="Lembretes de Partidas"
                    description="Receba um alerta 2h antes de uma partida se você ainda não palpitou."
                />
                <NotificationSettingRow
                    id="performance-updates"
                    title="Atualizações de Desempenho"
                    description="Seja notificado sobre seus pontos e mudanças no ranking após as rodadas."
                />
                 <NotificationSettingRow
                    id="news-and-updates"
                    title="Comunicados e Novidades"
                    description="Receba anúncios do admin, informações sobre novos campeonatos e funcionalidades."
                />
            </CardContent>
        </Card>
    );
}
