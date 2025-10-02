
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
import { User, AtSign, Heart, Link as LinkIcon, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { updateUserProfile, getTeams } from '@/lib/firebase/firestore';
import type { Team } from '@/lib/types';
import { Combobox } from '../ui/combobox';


const profileFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
  apelido: z.string().max(30, { message: "O apelido não pode ter mais de 30 caracteres." }).optional(),
  timeCoracao: z.string().max(50, { message: "O nome do time não pode ter mais de 50 caracteres." }).optional(),
  urlImagemPersonalizada: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, firebaseUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

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
  }, [user, form])

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
         <FormField
          control={form.control}
          name="urlImagemPersonalizada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem de Perfil</FormLabel>
               <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <FormControl>
                        <Input placeholder="https://i.postimg.cc/sua-imagem.png" {...field} className="pl-10" />
                    </FormControl>
                </div>
              <FormDescription>
                Use um site como <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline">postimages.org</a> para hospedar sua imagem e cole o "Link Direto" (Direct Link) aqui.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
  );
}
