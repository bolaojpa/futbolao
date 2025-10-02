
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, AtSign, Heart, Link as LinkIcon, Save, Loader2, Upload, Crop } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useRef } from 'react';
import { updateUserProfile, getTeams } from '@/lib/firebase/firestore';
import type { Team } from '@/lib/types';
import { Combobox } from '../ui/combobox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const profileFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
  apelido: z.string().max(30, { message: "O apelido não pode ter mais de 30 caracteres." }).optional(),
  timeCoracao: z.string().max(50, { message: "O nome do time não pode ter mais de 50 caracteres." }).optional(),
  urlImagemPersonalizada: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function getCroppedImg(image: HTMLImageElement, crop: CropType) {
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
        }, 'image/png');
    });
}

export function EditProfileForm() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, firebaseUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    
    // State for image cropper
    const [imgSrc, setImgSrc] = useState('');
    const [crop, setCrop] = useState<CropType>();
    const [completedCrop, setCompletedCrop] = useState<CropType>();
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        async function fetchTeams() {
            try {
                const fetchedTeams = await getTeams();
                setTeams(fetchedTeams.filter(t => t.type === 'club'));
            } catch (error) {
                toast({ title: "Erro ao buscar times", variant: "destructive" });
            }
        }
        fetchTeams();
    }, [toast]);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            nome: '',
            apelido: '',
            timeCoracao: '',
            urlImagemPersonalizada: '',
        },
        mode: "onChange",
    });

    useEffect(() => {
        if (user) {
            form.reset({
                nome: user.nome || '',
                apelido: user.apelido || '',
                timeCoracao: user.timeCoracao || '',
                urlImagemPersonalizada: user.urlImagemPersonalizada || '',
            })
        }
    }, [user, form]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop on new image
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropModalOpen(true);
            e.target.value = ''; // Reset file input
        }
    };
    
    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        const aspect = 1; // For a circle
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
                form.setValue('urlImagemPersonalizada', dataUrl, { shouldValidate: true, shouldDirty: true });
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

    const loginMethod = firebaseUser?.providerData.some(p => p.providerId === 'google.com') ? 'google' : 'email';

    async function onSubmit(data: ProfileFormValues) {
        if (!user) return;
        setIsLoading(true);
        try {
            await updateUserProfile(user.id, data);
            toast({
                title: "Perfil Atualizado!",
                description: "Suas informações foram salvas com sucesso.",
            });
            router.push('/dashboard/profile');
        } catch (error) {
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível atualizar seu perfil. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!user) {
        return <div className="flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Completo</FormLabel>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input
                                            placeholder="Seu nome completo"
                                            {...field}
                                            className="pl-10"
                                            disabled={loginMethod === 'google'}
                                        />
                                    </FormControl>
                                </div>
                                {loginMethod === 'google' && (
                                    <FormDescription>Seu nome é sincronizado com sua conta Google e não pode ser alterado aqui.</FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="apelido"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Apelido</FormLabel>
                                <div className="relative">
                                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="Como você quer ser chamado" {...field} className="pl-10" />
                                    </FormControl>
                                </div>
                                <FormDescription>
                                    Este será seu nome de exibição nos rankings.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="timeCoracao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Time do Coração</FormLabel>
                                <div className="relative">
                                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                                    <FormControl>
                                        <Combobox
                                            options={teams.map(t => ({ label: t.name, value: t.name }))}
                                            value={field.value || ''}
                                            onChange={field.onChange}
                                            placeholder="Selecione seu time do coração"
                                            searchPlaceholder="Buscar time..."
                                            notFoundMessage="Nenhum time encontrado."
                                            className="pl-10"
                                        />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>Imagem de Perfil</FormLabel>
                        <div className="flex items-center gap-4">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <FormControl>
                                <Input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/webp"
                                    className="border-none p-0 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    onChange={handleFileChange}
                                />
                            </FormControl>
                        </div>
                         <FormDescription>
                            Envie uma imagem (.jpg, .png, .webp) para usar como seu avatar personalizado.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>


                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/dashboard/profile">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </Form>

            <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Recortar Imagem de Perfil</DialogTitle>
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
