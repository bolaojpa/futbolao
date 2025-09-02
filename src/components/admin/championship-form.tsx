

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
import { CalendarIcon, Save, Plus, X, Eye, Image as ImageIcon, ChevronsUpDown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Championship } from '@/lib/data';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { ChampionBanner, ChampionBannerProps } from '../fame/champion-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


type Fase = {
    nome: string;
    idaEVolta: boolean;
    rodadas?: number;
}

const championshipFormSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, "O nome não pode ter mais de 50 caracteres."),
  iconUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  dataFim: z.date({ required_error: "A data de fim é obrigatória." }),
  tipoCampeonato: z.enum(['liga', 'copa', 'avulso'], { required_error: "Selecione o tipo do campeonato." }),
  modoEquipes: z.enum(['times', 'selecao', 'mista'], { required_error: "Selecione o modo de equipes." }),
  formatoFases: z.enum(['fases', 'rodadas']).optional(),
  fases: z.array(z.object({ 
      nome: z.string().min(1, "O nome da fase é obrigatório."), 
      idaEVolta: z.boolean(),
      rodadas: z.coerce.number().int().min(1).optional(),
    })).optional(),
  rodadas: z.coerce.number().int().min(1, "Deve haver pelo menos 1 rodada.").optional(),
  pontuacao: z.object({
    tradicional: z.object({
        ativo: z.boolean().default(true),
        exato: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
        situacao: z.coerce.number().int().min(1, "A pontuação deve ser no mínimo 1."),
    }),
    combo: z.object({
      ativo: z.boolean().default(false),
      gols: z.coerce.number().int().min(0, "A pontuação deve ser positiva.").optional().default(0),
      placar: z.coerce.number().int().min(0, "A pontuação deve ser positiva.").optional().default(0),
    }).optional(),
  }),
  banner: z.object({
    ativo: z.boolean(),
    campeonatoLogoUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
    backgroundUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
    displayMode: z.enum(['photo_and_names', 'names_only']).optional(),
  }),
  championPredictionSettings: z.object({
    active: z.boolean(),
    numberOfPicks: z.coerce.number().int().min(1, "O mínimo é 1.").max(10, "O máximo é 10.").optional(),
  }),
}).refine(data => data.dataFim > data.dataInicio, {
  message: "A data de fim deve ser posterior à data de início.",
  path: ["dataFim"], 
}).refine(data => {
    if (data.tipoCampeonato !== 'liga') {
        return !!data.formatoFases;
    }
    return true;
}, {
    message: "É necessário escolher um formato de fases.",
    path: ["formatoFases"],
});

type ChampionshipFormValues = z.infer<typeof championshipFormSchema>;

const predefinedPhases = [
    'Fase de Grupos',
    '16 avos de final',
    'Oitavas de final',
    'Quartas de final',
    'Semifinal',
    'Disputa 3º lugar',
    'Final',
];

interface ChampionshipFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmit: (data: Championship) => void;
    championship: Championship | null;
    children: React.ReactNode;
}

export function ChampionshipForm({ isOpen, setIsOpen, onSubmit, championship, children }: ChampionshipFormProps) {
  const [fasesList, setFasesList] = useState<Array<Fase>>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const form = useForm<ChampionshipFormValues>({
    resolver: zodResolver(championshipFormSchema),
    defaultValues: {
        nome: '',
        iconUrl: '',
        tipoCampeonato: 'liga',
        modoEquipes: 'times',
        pontuacao: { 
            tradicional: { ativo: true, exato: 10, situacao: 5 },
            combo: { ativo: false, gols: 3, placar: 7 },
        },
        fases: [],
        banner: {
            ativo: false,
            campeonatoLogoUrl: "",
            backgroundUrl: "",
            displayMode: 'photo_and_names',
        },
        championPredictionSettings: {
            active: false,
            numberOfPicks: 3,
        }
    },
  });

  const watchAllFields = form.watch();
  const isBannerActive = watchAllFields.banner?.ativo;
  const isComboActive = watchAllFields.pontuacao?.combo?.ativo;
  const isChampionPredictionActive = watchAllFields.championPredictionSettings?.active;
  const tipoCampeonato = watchAllFields.tipoCampeonato;
  const formatoFases = watchAllFields.formatoFases;

  useEffect(() => {
    if (isOpen && championship) {
      form.reset({
        nome: championship.nome,
        iconUrl: championship.iconUrl || '',
        dataInicio: typeof championship.dataInicio === 'string' ? parseISO(championship.dataInicio) : championship.dataInicio,
        dataFim: typeof championship.dataFim === 'string' ? parseISO(championship.dataFim) : championship.dataFim,
        tipoCampeonato: championship.tipoCampeonato,
        modoEquipes: championship.modoEquipes,
        formatoFases: championship.formatoFases,
        rodadas: championship.rodadas,
        fases: championship.fases,
        pontuacao: {
          tradicional: {
              ativo: championship.pontuacao.tradicional.ativo,
              exato: championship.pontuacao.tradicional.exato,
              situacao: championship.pontuacao.tradicional.situacao
          },
          combo: {
              ativo: championship.pontuacao.combo?.ativo || false,
              gols: championship.pontuacao.combo?.gols || 3,
              placar: championship.pontuacao.combo?.placar || 7,
          }
        },
        banner: {
            ativo: championship.banner?.ativo || false,
            campeonatoLogoUrl: championship.banner?.campeonatoLogoUrl || "",
            backgroundUrl: championship.banner?.backgroundUrl || "",
            displayMode: championship.banner?.displayMode || 'photo_and_names',
        },
        championPredictionSettings: {
            active: championship.championPredictionSettings?.active || false,
            numberOfPicks: championship.championPredictionSettings?.numberOfPicks || 3,
        }
      });
      setFasesList(championship.fases || []);
    } else if (isOpen) {
      form.reset({
        nome: '',
        iconUrl: '',
        dataInicio: undefined,
        dataFim: undefined,
        tipoCampeonato: 'liga',
        modoEquipes: 'times',
        pontuacao: { 
            tradicional: { ativo: true, exato: 10, situacao: 5 },
            combo: { ativo: false, gols: 3, placar: 7 },
        },
        fases: [],
        rodadas: undefined,
        banner: {
            ativo: false,
            campeonatoLogoUrl: "",
            backgroundUrl: "",
            displayMode: 'photo_and_names',
        },
        championPredictionSettings: {
            active: false,
            numberOfPicks: 3,
        }
      });
       setFasesList([]);
    }
  }, [championship, isOpen, form]);

  useEffect(() => {
    form.setValue('fases', fasesList);
  }, [fasesList, form]);

  const handleAddFase = (faseNome: string) => {
    if (faseNome && !fasesList.find(f => f.nome === faseNome)) {
        setFasesList(prev => [...prev, { nome: faseNome, idaEVolta: false }]);
    }
  };

  const handleRemoveFase = (index: number) => {
    setFasesList(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleFaseChange = <K extends keyof Fase>(index: number, key: K, value: Fase[K]) => {
      setFasesList(prev => {
          const newList = [...prev];
          newList[index][key] = value;
          return newList;
      });
  };

  const handleFormSubmit = (data: ChampionshipFormValues) => {
    const finalData: Championship = {
      ...championship, 
      id: championship?.id || `champ_${new Date().getTime()}`,
      nome: data.nome,
      iconUrl: data.iconUrl,
      dataInicio: data.dataInicio.toISOString(),
      dataFim: data.dataFim.toISOString(),
      tipoCampeonato: data.tipoCampeonato,
      modoEquipes: data.modoEquipes,
      formatoFases: data.tipoCampeonato === 'liga' ? 'rodadas' : data.formatoFases,
      rodadas: data.tipoCampeonato === 'liga' ? data.rodadas : (data.formatoFases === 'rodadas' ? data.rodadas : undefined),
      fases: data.formatoFases === 'fases' ? data.fases : undefined,
      participantes: championship?.participantes || [],
      pontuacao: {
        tradicional: data.pontuacao.tradicional,
        combo: data.pontuacao.combo,
      },
      banner: { 
        ativo: data.banner.ativo,
        campeonatoLogoUrl: data.banner.campeonatoLogoUrl,
        backgroundUrl: data.banner.backgroundUrl,
        displayMode: data.banner.displayMode,
       },
       championPredictionSettings: {
        active: data.championPredictionSettings.active,
        numberOfPicks: data.championPredictionSettings.numberOfPicks || 3,
       }
    };
    onSubmit(finalData);
    setIsOpen(false);
  };
  
  const title = championship ? "Editar Campeonato" : "Criar Novo Campeonato";
  const description = championship ? "Altere os dados do campeonato existente." : "Preencha as informações para adicionar um novo campeonato.";
  const buttonText = championship ? "Salvar Alterações" : "Criar Campeonato";

  const bannerPreviewProps: ChampionBannerProps = {
    id: 'preview',
    campeonatoLogoUrl: watchAllFields.banner?.campeonatoLogoUrl || 'https://www.ogol.com.br/img/logos/edicoes/129979_imgbank_.png',
    campeonatoNome: watchAllFields.nome || 'Nome do Campeonato',
    campeaoGeralNome: 'Campeão Exemplo',
    campeaoGeralAvatarUrl: 'https://picsum.photos/128/128',
    modoEquipes: watchAllFields.modoEquipes,
    palpiteiroNome: 'Melhor Palpiteiro, Segundo Melhor, Terceiro Melhor Colocado',
    palpiteiroAvatarUrl: 'https://picsum.photos/128/128',
    displayMode: watchAllFields.banner?.displayMode || 'photo_and_names',
  };

  return (
    <>
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">Gerais</TabsTrigger>
                    <TabsTrigger value="scoring">Pontuação</TabsTrigger>
                    <TabsTrigger value="banner">Banner</TabsTrigger>
                    <TabsTrigger value="champion" disabled={!isBannerActive}>Palpite Campeão</TabsTrigger>
                </TabsList>
                <div className="py-4">
                    <TabsContent value="general" className="space-y-6">
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
                         <FormField
                            control={form.control}
                            name="iconUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>URL do Ícone do Campeonato</FormLabel>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="https://exemplo.com/icone.png" {...field} className="pl-10" />
                                    </FormControl>
                                </div>
                                <FormDescription>
                                    Este ícone aparecerá ao lado do nome do campeonato nos cards de partidas.
                                </FormDescription>
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
                            name="modoEquipes"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Modo de Equipes</FormLabel>
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

                        <Separator />
                        
                        {tipoCampeonato === 'liga' ? (
                            <FormField
                                control={form.control}
                                name="rodadas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Rodadas</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 38" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : (
                             <div className="space-y-4 rounded-md border p-4">
                                <FormField
                                    control={form.control}
                                    name="formatoFases"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                        <FormLabel>Estrutura do Campeonato</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="fases" /></FormControl>
                                                    <FormLabel className="font-normal">Baseado em Fases (Mata-mata)</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="rodadas" /></FormControl>
                                                    <FormLabel className="font-normal">Baseado em Rodadas</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {formatoFases === 'fases' && (
                                    <div className="space-y-4 pl-2">
                                        <div className="flex gap-2">
                                            <Select onValueChange={(value) => value && handleAddFase(value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione uma fase para adicionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {predefinedPhases.map(phase => (
                                                        <SelectItem 
                                                            key={phase} 
                                                            value={phase}
                                                            disabled={fasesList.some(f => f.nome === phase)}
                                                        >
                                                            {phase}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            {fasesList.map((fase, index) => (
                                                <div key={index} className="flex flex-col gap-2 rounded-md bg-muted p-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold">{fase.nome}</span>
                                                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveFase(index)}>
                                                            <X className="h-4 w-4"/>
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-1.5 text-xs">
                                                            <Switch 
                                                                id={`ida-volta-${index}`} 
                                                                checked={fase.idaEVolta}
                                                                onCheckedChange={(checked) => handleFaseChange(index, 'idaEVolta', checked)}
                                                            />
                                                            <Label htmlFor={`ida-volta-${index}`}>Ida e Volta</Label>
                                                        </div>
                                                        {fase.nome === 'Fase de Grupos' && (
                                                            <div className="flex items-center gap-2">
                                                                <Label htmlFor={`rodadas-fase-${index}`} className="text-xs">Rodadas</Label>
                                                                <Input
                                                                    id={`rodadas-fase-${index}`}
                                                                    type="number"
                                                                    className="h-7 w-16"
                                                                    value={fase.rodadas ?? ''}
                                                                    onChange={(e) => handleFaseChange(index, 'rodadas', e.target.value === '' ? undefined : Number(e.target.value))}
                                                                    placeholder="Ex: 6"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {fasesList.length === 0 && <p className="text-xs text-muted-foreground text-center">Nenhuma fase adicionada.</p>}
                                        </div>
                                    </div>
                                )}
                                {formatoFases === 'rodadas' && (
                                     <FormField
                                        control={form.control}
                                        name="rodadas"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Rodadas</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 3" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}
                             </div>
                        )}
                    </TabsContent>
                    <TabsContent value="scoring" className="space-y-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <h3 className="text-md font-medium">Pontuação Tradicional</h3>
                                    <p className="text-sm text-muted-foreground">O sistema de pontuação padrão.</p>
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="pontuacao.tradicional.ativo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
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
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <h3 className="text-md font-medium">Sistema de Pontuação Combo</h3>
                                    <p className="text-sm text-muted-foreground">Pontos bônus por acertar gols ou o placar exato.</p>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="pontuacao.combo.ativo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                             <CardContent className="p-4 pt-0">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4" style={{ opacity: isComboActive ? 1 : 0.5 }}>
                                    <FormField
                                        control={form.control}
                                        name="pontuacao.combo.gols"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Acerto de Gols</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Ex: 3" {...field} disabled={!isComboActive} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pontuacao.combo.placar"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Combo (Gols + Placar)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Ex: 7" {...field} disabled={!isComboActive} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="banner" className="space-y-6">
                         <Card>
                            <CardHeader className="p-4">
                                <FormField
                                    control={form.control}
                                    name="banner.ativo"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Gerar Banner do Campeão</FormLabel>
                                                <FormDescription>
                                                    Ative para criar um banner no Hall da Fama ao finalizar este campeonato.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">
                                <div className="space-y-4" style={{ opacity: isBannerActive ? 1 : 0.5 }}>
                                    <FormField
                                        control={form.control}
                                        name="banner.campeonatoLogoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL da Logo do Banner</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="https://exemplo.com/logo.png" 
                                                        {...field}
                                                        disabled={!isBannerActive}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="banner.backgroundUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL da Imagem de Fundo (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="https://picsum.photos/857/828" 
                                                        {...field}
                                                        disabled={!isBannerActive}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="banner.displayMode"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Modo de Exibição do Banner</FormLabel>
                                                <FormControl>
                                                    <RadioGroup 
                                                        onValueChange={field.onChange} 
                                                        defaultValue={field.value}
                                                        className="flex flex-col space-y-1"
                                                        disabled={!isBannerActive}
                                                    >
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl><RadioGroupItem value="photo_and_names" /></FormControl>
                                                            <FormLabel className="font-normal">Foto e Nomes</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-3 space-y-0">
                                                            <FormControl><RadioGroupItem value="names_only" /></FormControl>
                                                            <FormLabel className="font-normal">Apenas Nomes</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!isBannerActive}>
                                        <Eye className="mr-2 h-4 w-4"/>
                                        Pré-visualizar Banner
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="champion" className="space-y-6">
                        <Card>
                             <CardHeader className="p-4">
                                <FormField
                                    control={form.control}
                                    name="championPredictionSettings.active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-amber-500" />
                                                    Palpite de Campeão
                                                </FormLabel>
                                                <FormDescription>
                                                    Permite que usuários palpitem no ranking final do campeonato.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                 <div className="rounded-lg border p-4 space-y-4" style={{ opacity: isChampionPredictionActive ? 1 : 0.5 }}>
                                    <FormField
                                        control={form.control}
                                        name="championPredictionSettings.numberOfPicks"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Escolhas</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 3" {...field} value={field.value ?? ''} disabled={!isChampionPredictionActive} />
                                                </FormControl>
                                                <FormDescription>Quantas equipes o usuário poderá classificar.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                 </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
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
    
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl w-full p-0 border-0 bg-transparent shadow-none">
                <DialogHeader className="hidden">
                <DialogTitle className="sr-only">Pré-visualização do Banner</DialogTitle>
                </DialogHeader>
                <div 
                    className="relative" 
                    style={{ 
                        backgroundImage: `url(${watchAllFields.banner?.backgroundUrl || 'https://picsum.photos/857/828'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <ChampionBanner {...bannerPreviewProps} />
                </div>
        </DialogContent>
    </Dialog>
  </>
  );
}
