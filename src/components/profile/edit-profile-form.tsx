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
import { mockUser } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { User, AtSign, Heart, Link as LinkIcon, Save } from 'lucide-react';
import Link from 'next/link';


const profileFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
  apelido: z.string().max(30, { message: "O apelido não pode ter mais de 30 caracteres." }).optional(),
  timeCoracao: z.string().max(50, { message: "O nome do time não pode ter mais de 50 caracteres." }).optional(),
  urlImagemPersonalizada: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Em um app real, isso viria do estado de autenticação
const loginMethod: 'google' | 'email' = 'email'; 

export function EditProfileForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nome: mockUser.nome || '',
      apelido: mockUser.apelido || '',
      timeCoracao: mockUser.timeCoracao || '',
      urlImagemPersonalizada: mockUser.urlImagemPersonalizada || '',
    },
    mode: "onChange",
  });

  function onSubmit(data: ProfileFormValues) {
    console.log("Profile data submitted:", data);
    toast({
      title: "Perfil Atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
    router.push('/dashboard/profile');
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
                Este será seu nome de exibição nos rankings. Se vazio, seu nome completo será usado.
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
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <FormControl>
                    <Input placeholder="Seu time de torcida" {...field} className="pl-10" />
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
                        <Input placeholder="https://exemplo.com/sua-foto.png" {...field} className="pl-10" />
                    </FormControl>
                </div>
              <FormDescription>
                Cole a URL de uma imagem para usar como foto de perfil. Deixe em branco para usar a imagem padrão.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/profile">Cancelar</Link>
            </Button>
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
            </Button>
        </div>
      </form>
    </Form>
  );
}
