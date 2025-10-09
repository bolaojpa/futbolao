

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, UserPlus, Save, Bot, BrainCircuit, Bell, Loader2, Palette, Image as ImageIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSystemSettings, updateSystemSettings } from '@/lib/firebase/firestore';
import { ThemeSettings } from '@/components/settings/theme-settings';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import type { SystemSettings } from '@/lib/types';


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SystemSettings>({
        allowRegistrations: true,
        enablePerformanceNotifications: true,
        enablePredictionConsultation: true,
        logoUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchSettings() {
            setLoading(true);
            try {
                const fetchedSettings = await getSystemSettings();
                if (fetchedSettings) {
                    setSettings(fetchedSettings);
                }
            } catch (error) {
                toast({ title: "Erro ao carregar configurações", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        }
        fetchSettings();
    }, [toast]);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await updateSystemSettings(settings);
            toast({
                title: "Configurações Salvas!",
                description: "As configurações gerais do bolão foram atualizadas com sucesso.",
            });
        } catch (error) {
            toast({ title: "Erro ao salvar", description: "Não foi possível salvar as configurações.", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

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
                        <Palette className="h-5 w-5" />
                        <CardTitle>Aparência</CardTitle>
                    </div>
                    <CardDescription>
                       Personalize o tema do aplicativo para sua visualização.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeSettings />
                </CardContent>
            </Card>

             <Card className="max-w-2xl">
                <CardHeader>
                     <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        <CardTitle>Logotipo do Aplicativo</CardTitle>
                    </div>
                    <CardDescription>
                        Insira a URL da imagem que será usada como logotipo em todo o sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="logo-url">URL da Logotipo</Label>
                        <Input
                            id="logo-url"
                            placeholder="https://exemplo.com/sua-logo.png"
                            value={settings.logoUrl || ''}
                            onChange={(e) => setSettings(prev => ({...prev, logoUrl: e.target.value }))}
                        />
                    </div>
                    {settings.logoUrl && (
                        <div className="flex flex-col items-center gap-4 rounded-lg border p-4 bg-muted/50">
                            <Label>Pré-visualização</Label>
                            <Image 
                                src={settings.logoUrl}
                                alt="Pré-visualização da logotipo"
                                width={80}
                                height={80}
                                className="object-contain rounded-md bg-background p-2"
                                unoptimized // Permite carregar de qualquer URL
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

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
                            checked={settings.allowRegistrations}
                            onCheckedChange={(checked) => setSettings(prev => ({...prev, allowRegistrations: checked}))}
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
                            checked={settings.enablePerformanceNotifications}
                            onCheckedChange={(checked) => setSettings(prev => ({...prev, enablePerformanceNotifications: checked}))}
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
                            checked={settings.enablePredictionConsultation}
                            onCheckedChange={(checked) => setSettings(prev => ({...prev, enablePredictionConsultation: checked}))}
                            aria-label="Ativar consulta de IA nos palpites"
                        />
                    </div>
                </CardContent>
            </Card>
            
             <div className="max-w-2xl">
                <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                    Salvar Todas as Configurações
                </Button>
            </div>

        </div>
    );
}
