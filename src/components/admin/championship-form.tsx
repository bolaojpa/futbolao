
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from '../ui/calendar';
import { CalendarIcon, PlusCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Championship } from '@/lib/data';
import { useEffect } from 'react';

const championshipFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, "O nome não pode ter mais de 50 caracteres."),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  dataFim: z.date({ required_error: "A data de fim é obrigatória." }),
  pontuacao: z.object({
    exato: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
    situacao: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
  }),
}).refine(data => data.dataFim > data.dataInicio, {
  message: "A data de fim deve ser posterior à data de início.",
  path: ["dataFim"], 
});

type ChampionshipFormValues = z.infer<typeof championshipFormSchema>;

interface ChampionshipFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: Championship) => void;
    championship: Championship | null;
    children: React.ReactNode;
}

export function ChampionshipForm({ isOpen, setIsOpen, onSubmit, championship, children }: ChampionshipFormProps) {
  const form = useForm<ChampionshipFormValues>({
    resolver: zodResolver(championshipFormSchema),
    defaultValues: {
        nome: '',
        pontuacao: { exato: 10, situacao: 5 }
    },
  });

  useEffect(() => {
    if (championship) {
      form.reset({
        nome: championship.nome,
        dataInicio: typeof championship.dataInicio === 'string' ? new Date(championship.dataInicio) : championship.dataInicio,
        dataFim: typeof championship.dataFim === 'string' ? new Date(championship.dataFim) : championship.dataFim,
        pontuacao: {
          exato: championship.pontuacao.exato,
          situacao: championship.pontuacao.situacao,
        }
      });
    } else {
      form.reset({
        nome: '',
        dataInicio: undefined,
        dataFim: undefined,
        pontuacao: { exato: 10, situacao: 5 }
      });
    }
  }, [championship, form]);

  const handleFormSubmit = (data: ChampionshipFormValues) => {
    const finalData: Championship = {
      ...data,
      id: championship?.id || `champ_${new Date().getTime()}`,
      dataInicio: data.dataInicio.toISOString(),
      dataFim: data.dataFim.toISOString(),
    };
    onSubmit(finalData);
    setIsOpen(false);
    form.reset();
  };
  
  const title = championship ? "Editar Campeonato" : "Criar Novo Campeonato";
  const description = championship ? "Altere os dados do campeonato existente." : "Preencha as informações para adicionar um novo campeonato.";
  const buttonText = championship ? "Salvar Alterações" : "Criar Campeonato";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Campeonato</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Brasileirão Série A 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="dataInicio"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date("1900-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="dataFim"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data de Fim</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "dd/MM/yyyy")
                                ) : (
                                    <span>Escolha uma data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < (form.getValues("dataInicio") || new Date("1900-01-01"))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <div>
                <h3 className="mb-2 text-sm font-medium">Sistema de Pontuação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                    <FormField
                    control={form.control}
                    name="pontuacao.exato"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Placar Exato</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Ex: 10" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="pontuacao.situacao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Vencedor/Empate</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="Ex: 5" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormDescription className="p-2">
                    Defina quantos pontos os jogadores ganham por acertar o resultado.
                </FormDescription>
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {buttonText}
                </Button>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
