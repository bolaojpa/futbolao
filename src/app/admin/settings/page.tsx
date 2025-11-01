

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, UserPlus, Save, Bot, BrainCircuit, Bell, Loader2, Palette, Image as ImageIcon, Upload, Crop, Trash2, AlertTriangle, Smartphone } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { savePwaIcon } from './actions';


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
    const [cropTarget, setCropTarget] = useState<'logo' | 'pwaIcon'>('logo');
    const imgRef = useRef<HTMLImageElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pwaFileInputRef = useRef<HTMLInputElement>(null);


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
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'pwaIcon') => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); 
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setCropTarget(target);
            setIsCropModalOpen(true);
            // Limpa o valor do input para permitir o mesmo arquivo ser selecionado novamente
            if (e.target) e.target.value = '';
        }
    };
    
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const aspect = 1; 
        const newCrop = centerCrop(
            makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
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
                if (cropTarget === 'logo') {
                    setSettings(prev => ({...prev, logoUrl: dataUrl }));
                    toast({ title: "Logotipo pronta", description: "A nova logotipo está pronta. Clique em 'Salvar Todas as Configurações' para aplicá-la." });
                } else if (cropTarget === 'pwaIcon') {
                     const result = await savePwaIcon(dataUrl);
                     if (result.success) {
                        toast({ title: "Ícone do App Atualizado!", description: "O novo ícone foi salvo. Pode ser necessário reinstalar o app para ver a mudança.", duration: 8000 });
                     } else {
                        throw new Error(result.error);
                     }
                }
                setIsCropModalOpen(false);
            } catch (e) {
                console.error(e);
                toast({ title: "Erro ao processar imagem", description: (e as Error).message, variant: "destructive" });
            }
        }
    };

     const handleRemoveImage = (target: 'logo') => {
        if (target === 'logo') {
            setSettings(prev => ({...prev, logoUrl: '' }));
            toast({
                title: "Logotipo removida",
                description: "Clique em 'Salvar Alterações' para confirmar e reverter para a logo padrão.",
            });
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
                        <CardTitle>Identidade Visual</CardTitle>
                    </div>
                    <CardDescription>
                        Personalize a logotipo do site e o ícone do aplicativo PWA.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div>
                        <Label className="text-base font-semibold">Logotipo do Site</Label>
                        <p className="text-sm text-muted-foreground mb-4">Exibida na tela de login e no menu principal.</p>
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
                                onChange={(e) => handleFileChange(e, 'logo')}
                                ref={fileInputRef}
                                id="logo-upload"
                            />
                            <label htmlFor="logo-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                                <Upload className="mr-2 h-4 w-4" />
                                {settings.logoUrl ? 'Alterar' : 'Escolher Imagem'}
                            </label>
                            {settings.logoUrl && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" type="button">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Remover Logotipo?</AlertDialogTitle><AlertDialogDescription>Isto reverterá para a logo padrão do sistema.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveImage('logo')}>Sim, remover</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <Label className="text-base font-semibold">Ícone do App (PWA)</Label>
                        <p className="text-sm text-muted-foreground mb-4">Ícone que aparece na tela inicial do celular após a instalação. <strong className="text-primary">Use apenas imagens PNG.</strong></p>
                        <div className="flex items-center gap-4">
                             <Image 
                                src="/logo-192x192.png"
                                alt="Ícone PWA atual"
                                width={64}
                                height={64}
                                className="object-contain rounded-md bg-muted p-1 border"
                                key={Date.now()} // Força o re-render da imagem
                            />
                            <Input 
                                type="file" 
                                accept="image/png"
                                className="hidden"
                                onChange={(e) => handleFileChange(e, 'pwaIcon')}
                                ref={pwaFileInputRef}
                                id="pwa-icon-upload"
                            />
                            <label htmlFor="pwa-icon-upload" className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer")}>
                                <Smartphone className="mr-2 h-4 w-4" />
                                Alterar Ícone PWA
                            </label>
                        </div>
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
                    <DialogTitle>Recortar Imagem</DialogTitle>
                    <DialogDescription>
                        Ajuste a imagem para que se encaixe perfeitamente. Use um formato quadrado.
                    </DialogDescription>
                </DialogHeader>
                {imgSrc && (
                    <div className="my-4 flex justify-center">
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={1}
                            circularCrop={cropTarget === 'logo'}
                        >
                            <img
                                ref={imgRef}
                                alt="Recorte"
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
