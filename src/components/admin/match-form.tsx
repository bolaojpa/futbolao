

"use client";

import { useForm, Controller } from 'react-hook-form';
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
import { CalendarIcon, Save, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import type { Match } from '@/lib/data';
import { useEffect } from 'react';
import { mockChampionships } from '@/lib/data';

const matchFormSchema = z.object({
  timeA: z.string().min(2, { message: "O nome do time deve ter pelo menos 2 caracteres." }),
  timeB: z.string().min(2, { message: "O nome do time deve ter pelo menos 2 caracteres." }),
  fase: z.string().min(3, { message: "A fase deve ter pelo menos 3 caracteres." }),
  data: z.date({ required_error: "A data da partida é obrigatória." }),
  hora: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido (HH:mm)."}),
}).refine(data => data.timeA !== data.timeB, {
    message: "Os times A e B não podem ser iguais.",
    path: ["timeB"],
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: Match) => void;
    match: Match | null;
    championshipId: string;
    children: React.ReactNode;
}

export function MatchForm({ isOpen, setIsOpen, onSubmit, match, championshipId, children }: MatchFormProps) {
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
        timeA: '',
        timeB: '',
        fase: '',
        hora: '16:00',
    },
  });

  useEffect(() => {
    if (isOpen && match) {
      const matchDate = parseISO(match.data);
      form.reset({
        timeA: match.timeA,
        timeB: match.timeB,
        fase: match.fase,
        data: matchDate,
        hora: format(matchDate, 'HH:mm'),
      });
    } else if (isOpen) {
      form.reset({
        timeA: '',
        timeB: '',
        fase: '',
        data: undefined,
        hora: '16:00',
      });
    }
  }, [match, isOpen, form]);

  const handleFormSubmit = (data: MatchFormValues) => {
    const [hours, minutes] = data.hora.split(':').map(Number);
    const combinedDate = setMinutes(setHours(data.data, hours), minutes);

    const championship = mockChampionships.find(c => c.id === championshipId)!;
    
    // Calcula a pontuação máxima
    let maxScore = 0;
    if (championship.pontuacao.tradicional.ativo) {
        maxScore += championship.pontuacao.tradicional.exato;
    }
    if (championship.pontuacao.combo?.ativo) {
        maxScore += (championship.pontuacao.combo.gols + championship.pontuacao.combo.placar);
    }


    const finalData: Match = {
      id: match?.id || `match_${new Date().getTime()}`,
      timeA: data.timeA,
      timeB: data.timeB,
      fase: data.fase,
      data: combinedDate.toISOString(),
      status: 'Agendado',
      campeonato: championship.nome,
      campeonatoId: championship.id,
      maxPontos: maxScore,
    };
    onSubmit(finalData);
    setIsOpen(false);
  };
  
  const title = match ? "Editar Partida" : "Adicionar Nova Partida";
  const description = match ? "Altere os dados da partida existente." : "Preencha as informações para adicionar uma nova partida ao campeonato.";
  const buttonText = match ? "Salvar Alterações" : "Adicionar Partida";

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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="timeA"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time A</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do time da casa" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="timeB"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Time B</FormLabel>
                        <FormControl>
                            <Input placeholder="Nome do time visitante" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            <FormField
              control={form.control}
              name="fase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase / Rodada</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rodada 15, Oitavas de Final" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Data da Partida</FormLabel>
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
                    name="hora"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Hora da Partida</FormLabel>
                         <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input placeholder="HH:mm" {...field} className="pl-10" />
                            </FormControl>
                         </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />
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
