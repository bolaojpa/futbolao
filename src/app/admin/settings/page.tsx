

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, UserPlus, Save, Bot, BrainCircuit, Bell, Loader2, Palette, Image as ImageIcon, Upload, Crop, Trash2, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSystemSettings, updateSystemSettings } from '@/lib/firebase/firestore';
import { ThemeSettings } from '@/components/settings/theme-settings';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import type { SystemSettings } from '@/lib/types';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// Helper function from edit-profile-form
function getCroppedImg(image: HTMLImageElement, crop: CropType): Promise<string> {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not get 2D context from canvas");
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise<string>((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
        }, 'image/png', 0.8); // Compress image slightly
    });
}


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

    // State for image cropper
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<CropType>();
    const [completedCrop, setCompletedCrop] = useState<CropType>();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


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
    
    // Image Cropper handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop on new image
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropModalOpen(true);
            if(fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };
    
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const aspect = 1; 
        const newCrop = centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 90,
                },
                aspect,
                width,
                height
            ),
            width,
            height
        );
        setCrop(newCrop);
        setCompletedCrop(newCrop);
    };

    const handleCropComplete = async () => {
        if (completedCrop && imgRef.current) {
            try {
                const dataUrl = await getCroppedImg(imgRef.current, completedCrop);
                setSettings(prev => ({...prev, logoUrl: dataUrl }));
                setIsCropModalOpen(false);
            } catch (e) {
                console.error(e);
                toast({
                    title: "Erro ao recortar imagem",
                    variant: "destructive",
                });
            }
        }
    };
     const handleRemoveImage = () => {
        setSettings(prev => ({...prev, logoUrl: '' }));
        toast({
            title: "Logotipo removida",
            description: "Clique em 'Salvar Alterações' para confirmar e reverter para a logo padrão.",
        });
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
      <>
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
                        Faça o upload de uma imagem que será usada como logotipo em todo o sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-4">
                        {settings.logoUrl && (
                             <Image 
                                src={settings.logoUrl}
                                alt="Pré-visualização da logotipo"
                                width={64}
                                height={64}
                                className="object-contain rounded-md bg-muted p-1 border"
                                unoptimized
                            />
                        )}
                        <Input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                            <Upload className="mr-2 h-4 w-4" />
                            {settings.logoUrl ? 'Alterar Imagem' : 'Escolher Imagem'}
                        </label>
                         {settings.logoUrl && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" type="button">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Remover Imagem</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2">
                                            <AlertTriangle className="text-destructive"/>
                                            Remover Logotipo?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tem certeza de que deseja remover a logotipo personalizada? O sistema voltará a usar a logo padrão.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleRemoveImage}>Sim, remover</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
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
        
         <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recortar Logotipo</DialogTitle>
                </DialogHeader>
                {imgSrc && (
                    <div className="my-4 flex justify-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imgSrc}
                                onLoad={onImageLoad}
                                style={{ maxHeight: '70vh' }}
                            />
                        </ReactCrop>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCropComplete}>
                         <Crop className="mr-2 h-4 w-4"/>
                        Confirmar Recorte
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}

