
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
import { CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Championship } from '@/lib/data';
import { useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';

const championshipFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, "O nome não pode ter mais de 50 caracteres."),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  dataFim: z.date({ required_error: "A data de fim é obrigatória." }),
  tipoCampeonato: z.enum(['liga', 'copa', 'avulso'], { required_error: "Selecione o tipo do campeonato." }),
  tipoPalpite: z.enum(['times', 'selecao', 'mista'], { required_error: "Selecione o tipo de palpite." }),
  pontuacao: z.object({
    tradicional: z.object({
        ativo: z.boolean().default(true),
        exato: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
        situacao: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
    })
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
        tipoCampeonato: 'liga',
        tipoPalpite: 'times',
        pontuacao: { 
            tradicional: { ativo: true, exato: 10, situacao: 5 }
        }
    },
  });

  useEffect(() => {
    if (isOpen && championship) {
      form.reset({
        nome: championship.nome,
        dataInicio: typeof championship.dataInicio === 'string' ? parseISO(championship.dataInicio) : championship.dataInicio,
        dataFim: typeof championship.dataFim === 'string' ? parseISO(championship.dataFim) : championship.dataFim,
        tipoCampeonato: championship.tipoCampeonato,
        tipoPalpite: championship.tipoPalpite,
        pontuacao: {
          tradicional: {
              ativo: championship.pontuacao.tradicional.ativo,
              exato: championship.pontuacao.tradicional.exato,
              situacao: championship.pontuacao.tradicional.situacao
          }
        }
      });
    } else if (isOpen) {
      form.reset({
        nome: '',
        dataInicio: undefined,
        dataFim: undefined,
        tipoCampeonato: 'liga',
        tipoPalpite: 'times',
        pontuacao: { 
            tradicional: { ativo: true, exato: 10, situacao: 5 }
        }
      });
    }
  }, [championship, isOpen, form]);

  const handleFormSubmit = (data: ChampionshipFormValues) => {
    // A lógica de conversão final será expandida à medida que adicionamos campos.
    const finalData: Championship = {
      ...championship, // Mantém campos não editados
      id: championship?.id || `champ_${new Date().getTime()}`,
      nome: data.nome,
      dataInicio: data.dataInicio.toISOString(),
      dataFim: data.dataFim.toISOString(),
      tipoCampeonato: data.tipoCampeonato,
      tipoPalpite: data.tipoPalpite,
      pontuacao: {
        ...championship?.pontuacao,
        tradicional: data.pontuacao.tradicional,
        sistema: 'tradicional', // Placeholder
        combo: { ativo: false, gols: 0, placar: 0 } // Placeholder
      },
      banner: championship?.banner || { ativo: false } // Placeholder
    };
    onSubmit(finalData);
    setIsOpen(false);
  };
  
  const title = championship ? "Editar Campeonato" : "Criar Novo Campeonato";
  const description = championship ? "Altere os dados do campeonato existente." : "Preencha as informações para adicionar um novo campeonato.";
  const buttonText = championship ? "Salvar Alterações" : "Criar Campeonato";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
            
            {/* DADOS GERAIS */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                        className={cn("pl-3 text-left font-normal",!field.value && "text-muted-foreground")}
                                        >
                                        {field.value ? (format(field.value, "dd/MM/yyyy")) : (<span>Escolha uma data</span>)}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
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
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? (format(field.value, "dd/MM/yyyy")) : (<span>Escolha uma data</span>)}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < (form.getValues("dataInicio") || new Date("1900-01-01"))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="tipoCampeonato"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Tipo do Campeonato</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="liga" /></FormControl>
                                        <FormLabel className="font-normal">Liga (Pontos Corridos)</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="copa" /></FormControl>
                                        <FormLabel className="font-normal">Copa (Mata-mata)</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="avulso" /></FormControl>
                                        <FormLabel className="font-normal">Jogos Avulsos (Amistosos)</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="tipoPalpite"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Tipo de Palpite</FormLabel>
                             <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="times" /></FormControl>
                                        <FormLabel className="font-normal">Times (Clubes)</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="selecao" /></FormControl>
                                        <FormLabel className="font-normal">Seleções Nacionais</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl><RadioGroupItem value="mista" /></FormControl>
                                        <FormLabel className="font-normal">Mista (Clubes e Seleções)</FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <Separator />

            {/* SISTEMA DE PONTUAÇÃO */}
            <Card>
                <CardHeader>
                    <CardTitle>Sistema de Pontuação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h3 className="mb-2 text-md font-medium">Pontuação Tradicional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                            <FormField
                                control={form.control}
                                name="pontuacao.tradicional.exato"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Placar Exato (Bucha)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 10" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pontuacao.tradicional.situacao"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Situação (Vencedor/Empate)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 5" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Separator />

            {/* BANNER DO CAMPEÃO */}
             <Card>
                <CardHeader>
                    <CardTitle>Banner do Campeão</CardTitle>
                    <FormDescription>Configurações do banner que aparecerá no Hall da Fama.</FormDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center p-4 border rounded-md">As opções de personalização do banner aparecerão aqui em breve.</p>
                </CardContent>
             </Card>

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

    
