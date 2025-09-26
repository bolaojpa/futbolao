

"use client";

import * as React from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { addSupportMessage } from '@/lib/firebase/firestore';


const supportFormSchema = z.object({
  message: z.string()
    .min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." })
    .max(1000, { message: "A mensagem não pode ter mais de 1000 caracteres." }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export function SupportForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      message: '',
    },
    mode: "onChange",
  });

  async function onSubmit(data: SupportFormValues) {
    if (!user) {
        toast({ title: "Erro de Autenticação", description: "Você precisa estar logado para enviar uma mensagem.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    
    try {
        await addSupportMessage({
            userId: user.id,
            userApelido: user.apelido,
            userFoto: user.fotoPerfil,
            message: data.message,
        });
        toast({
            title: "Mensagem Enviada!",
            description: "Sua mensagem foi recebida com sucesso. Agradecemos o seu contato.",
        });
        form.reset();
    } catch (error) {
        toast({ title: "Erro ao Enviar", description: "Não foi possível enviar sua mensagem. Tente novamente mais tarde.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sua Mensagem</FormLabel>
                <FormControl>
                    <Textarea
                        placeholder="Descreva seu problema ou sugestão aqui..."
                        className="min-h-[150px]"
                        {...field}
                    />
                </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="submit" disabled={!form.formState.isValid || isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Mensagem
            </Button>
        </div>
      </form>
    </Form>
  );
}
