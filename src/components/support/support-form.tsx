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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';


const supportFormSchema = z.object({
  message: z.string()
    .min(10, { message: "A mensagem deve ter pelo menos 10 caracteres." })
    .max(1000, { message: "A mensagem não pode ter mais de 1000 caracteres." }),
});

type SupportFormValues = z.infer<typeof supportFormSchema>;

export function SupportForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<SupportFormValues>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      message: '',
    },
    mode: "onChange",
  });

  function onSubmit(data: SupportFormValues) {
    console.log("Support message submitted:", data);
    // Em uma aplicação real, aqui você enviaria a mensagem para o Firestore
    toast({
      title: "Mensagem Enviada!",
      description: "Sua mensagem foi recebida com sucesso. Agradecemos o seu contato.",
    });
    form.reset(); // Limpa o formulário após o envio
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
            <Button type="submit" disabled={!form.formState.isValid}>
                <Send className="mr-2 h-4 w-4" />
                Enviar Mensagem
            </Button>
        </div>
      </form>
    </Form>
  );
}
