
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
import { CalendarIcon, Save, Eye, Image as ImageIcon, ChevronsUpDown, Trophy, Shield, Search, X, Users, ClipboardList, Percent, BrainCircuit, Gavel, Palette, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import type { Championship, Match, Team, UserType, TiebreakerRule } from '@/lib/types';
import { useEffect, useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { ChampionBanner, ChampionBannerProps } from '../fame/champion-banner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getTeams, getUsers, updateUserField } from '@/lib/firebase/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '../ui/combobox';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Fase = {
    nome: string;
    idaEVolta: boolean;
    rodadas?: number;
}

const championshipFormSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, "O nome não pode ter mais de 50 caracteres."),
  iconUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
  dataInicio: z.date({ required_error: "A data de início é obrigatória." }),
  dataFim: z.date({ required_error: "A data de fim é obrigatória." }),
  tipoCampeonato: z.enum(['liga', 'copa', 'avulso'], { required_error: "Selecione o tipo do campeonato." }),
  modoEquipes: z.enum(['times', 'selecao', 'mista'], { required_error: "Selecione o modo de equipes." }),
  incluirFantasma: z.boolean().default(false),
  teamIds: z.array(z.string()).min(2, "Selecione pelo menos duas equipes."),
  participantes: z.array(z.string()).min(1, "Selecione pelo menos um participante."),
  regrasDesempate: z.array(z.string()).optional(),
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
        exato: z.coerce.number().int().min(0, "A pontuação deve ser positiva."),
        situacao: z.coerce.number().int().min(0, "A pontuação deve ser positiva."),
    }),
    combo: z.object({
      ativo: z.boolean().default(false),
      bonusPlacarExatoGols: z.coerce.number().int().min(0).default(5),
      pontosGols: z.coerce.number().int().min(0).default(1),
      cotasPorFase: z.array(z.object({
          fase: z.string(),
          quantidade: z.coerce.number().int().min(0, "A quantidade não pode ser negativa."),
      })).optional(),
    }).optional(),
  }),
  predictionAssist: z.object({
    active: z.boolean().default(false),
  }).optional(),
  banner: z.object({
    ativo: z.boolean(),
    campeonatoLogoUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
    backgroundUrl: z.string().url({ message: "Por favor, insira uma URL válida." }).or(z.literal("")).optional(),
    displayMode: z.enum(['photo_and_names', 'names_only']).optional(),
    titleColor: z.string().optional(),
    subtitleColor: z.string().optional(),
    namesColor: z.string().optional(),
  }),
  championPredictionSettings: z.object({
    active: z.boolean(),
    numberOfPicks: z.coerce.number().int().min(1, "O mínimo é 1.").max(10, "O máximo é 10.").optional(),
  }),
  finalRanking: z.object({
    pos1: z.string().optional(),
    pos2: z.string().optional(),
    pos3: z.string().optional(),
    pos4: z.string().optional(),
    pos5: z.string().optional(),
  }).optional(),
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
    onSubmit: (data: Omit<Championship, 'status'>) => void;
    championship: Championship | null;
    allMatches: Match[];
    children: React.ReactNode;
}

export function ChampionshipForm({ isOpen, setIsOpen, onSubmit, championship, allMatches, children }: ChampionshipFormProps) {
  const [fasesList, setFasesList] = useState<Array<Fase>>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const { toast } = useToast();
  
  const isChampionshipStarted = useMemo(() => {
    if (!championship) return false;
    return allMatches.some(
      match => match.campeonatoId === championship.id && (match.status === 'Ao Vivo' || match.status === 'Finalizado')
    );
  }, [championship, allMatches]);
  
  useEffect(() => {
    async function fetchData() {
        const [teamsData, usersData] = await Promise.all([getTeams(), getUsers()]);
        setAllTeams(teamsData);
        setAllUsers(usersData);
    }
    fetchData();
  }, []);
  
  const form = useForm<ChampionshipFormValues>({
    resolver: zodResolver(championshipFormSchema),
    defaultValues: {
        nome: '',
        iconUrl: '',
        tipoCampeonato: 'liga',
        modoEquipes: 'times',
        incluirFantasma: false,
        teamIds: [],
        participantes: [],
        regrasDesempate: [],
        pontuacao: { 
            tradicional: { ativo: true, exato: 6, situacao: 3 },
            combo: { ativo: false, bonusPlacarExatoGols: 5, pontosGols: 1, cotasPorFase: [] },
        },
        predictionAssist: { active: false },
        fases: [],
        banner: {
            ativo: false,
            campeonatoLogoUrl: "",
            backgroundUrl: "",
            displayMode: 'photo_and_names',
            titleColor: '#FFFFFF',
            subtitleColor: '#FBBF24',
            namesColor: '#FFFFFF',
        },
        championPredictionSettings: {
            active: false,
            numberOfPicks: 3,
        },
        finalRanking: { pos1: '', pos2: '', pos3: '', pos4: '', pos5: '' }
    },
  });

  const watchAllFields = form.watch();
  const isBannerActive = watchAllFields.banner?.ativo;
  const isComboActive = watchAllFields.pontuacao?.combo?.ativo;
  const isChampionPredictionActive = watchAllFields.championPredictionSettings?.active;
  const tipoCampeonato = watchAllFields.tipoCampeonato;
  const formatoFases = watchAllFields.formatoFases;
  const modoEquipes = watchAllFields.modoEquipes;
  const selectedTeamIds = watchAllFields.teamIds || [];
  const selectedParticipantIds = watchAllFields.participantes || [];
  const finalRankingValues = watchAllFields.finalRanking || {};

  const teamOptionsForRanking = useMemo(() => {
    if (!selectedTeamIds) return [];

    const participatingTeams = allTeams.filter(team => selectedTeamIds.includes(team.id));
    return participatingTeams.map(team => ({ label: team.name, value: team.name }));
  }, [selectedTeamIds, allTeams]);

  const availableTeams = useMemo(() => {
    return allTeams
      .filter(team => {
        if (modoEquipes === 'mista') return true;
        return team.type === (modoEquipes === 'times' ? 'club' : 'national');
      })
      .filter(team => team.name.toLowerCase().includes(teamSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [modoEquipes, teamSearch, allTeams]);
  
  const availableUsers = useMemo(() => {
    return allUsers
      .filter(user => user.status === 'ativo' && user.funcao !== 'admin')
      .filter(user => user.apelido.toLowerCase().includes(userSearch.toLowerCase()) || user.nome.toLowerCase().includes(userSearch.toLowerCase()))
      .sort((a, b) => a.apelido.localeCompare(b.apelido));
  }, [userSearch, allUsers]);

  const availablePhasesForCombo = useMemo(() => {
    if (tipoCampeonato === 'liga') {
        const numRodadas = form.getValues('rodadas') || 0;
        return Array.from({ length: numRodadas }, (_, i) => `Rodada ${i + 1}`);
    }
    if (formatoFases === 'fases') {
        return fasesList.map(f => f.nome);
    }
    if (formatoFases === 'rodadas') {
        const numRodadas = form.getValues('rodadas') || 0;
        return Array.from({ length: numRodadas }, (_, i) => `Rodada ${i + 1}`);
    }
    return [];
  }, [tipoCampeonato, formatoFases, fasesList, form.getValues('rodadas')]);


  useEffect(() => {
    if (isOpen) {
        const defaultData = {
            id: undefined,
            nome: '',
            iconUrl: '',
            tipoCampeonato: 'liga' as const,
            modoEquipes: 'times' as const,
            incluirFantasma: false,
            teamIds: [],
            participantes: [],
            regrasDesempate: [],
            formatoFases: undefined,
            fases: [],
            rodadas: undefined,
            pontuacao: {
                tradicional: { ativo: true, exato: 6, situacao: 3 },
                combo: { ativo: false, bonusPlacarExatoGols: 5, pontosGols: 1, cotasPorFase: [] },
            },
            predictionAssist: { active: false },
            banner: {
                ativo: false,
                campeonatoLogoUrl: "",
                backgroundUrl: "",
                displayMode: 'photo_and_names' as const,
                titleColor: '#FFFFFF',
                subtitleColor: '#FBBF24',
                namesColor: '#FFFFFF',
            },
            championPredictionSettings: {
                active: false,
                numberOfPicks: 3,
            },
            finalRanking: { pos1: '', pos2: '', pos3: '', pos4: '', pos5: '' },
            dataInicio: undefined,
            dataFim: undefined
        };

        if (championship) {
            form.reset({
                ...defaultData,
                id: championship.id,
                nome: championship.nome,
                iconUrl: championship.iconUrl || '',
                dataInicio: typeof championship.dataInicio === 'string' ? parseISO(championship.dataInicio) : championship.dataInicio,
                dataFim: typeof championship.dataFim === 'string' ? parseISO(championship.dataFim) : championship.dataFim,
                tipoCampeonato: championship.tipoCampeonato,
                modoEquipes: championship.modoEquipes,
                incluirFantasma: championship.incluirFantasma || false,
                teamIds: championship.teamIds || [],
                participantes: championship.participantes || [],
                regrasDesempate: championship.regrasDesempate || [],
                formatoFases: championship.formatoFases,
                rodadas: championship.rodadas,
                fases: championship.fases,
                pontuacao: {
                    tradicional: championship.pontuacao.tradicional,
                    combo: championship.pontuacao.combo || defaultData.pontuacao.combo,
                },
                predictionAssist: championship.predictionAssist || defaultData.predictionAssist,
                banner: {
                    ...defaultData.banner,
                    ...championship.banner,
                },
                championPredictionSettings: championship.championPredictionSettings || defaultData.championPredictionSettings,
                finalRanking: championship.finalRanking || defaultData.finalRanking,
            });
            setFasesList(championship.fases || []);
        } else {
            form.reset(defaultData);
            setFasesList([]);
        }
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

  const handleFormSubmit = async (data: ChampionshipFormValues) => {
    let finalData = { ...data };

    if (data.incluirFantasma) {
        const ghostUserRef = doc(db, "users", "GHOST_USER_ID");
        const ghostUserSnap = await getDoc(ghostUserRef);

        if (!ghostUserSnap.exists()) {
            await setDoc(ghostUserRef, {
                id: 'GHOST_USER_ID',
                nome: 'Lóia (IA)',
                apelido: 'Lóia',
                email: 'ghost@futbolao.pro',
                fotoPerfil: `https://ui-avatars.com/api/?name=L&background=random`,
                status: 'ativo',
                funcao: 'usuario',
                dataCadastro: serverTimestamp(),
                titulos: 0,
                totalJogos: 0,
                championshipStats: [],
                presenceStatus: 'Disponível',
                isGhost: true,
            });
             toast({ title: "Fantasma Criado!", description: "O jogador Lóia (IA) foi adicionado ao sistema." });
        }
        
        // Garante que o fantasma está na lista de participantes se a opção estiver marcada
        if (!finalData.participantes.includes('GHOST_USER_ID')) {
            finalData.participantes.push('GHOST_USER_ID');
        }
    } else {
        // Garante que o fantasma é removido se a opção for desmarcada
        finalData.participantes = finalData.participantes.filter(pId => pId !== 'GHOST_USER_ID');
    }

    onSubmit(finalData as Omit<Championship, 'status'>);
    setIsOpen(false);
  };
  
  const title = championship ? "Editar Campeonato" : "Criar Novo Campeonato";
  const description = championship ? "Altere os dados do campeonato existente." : "Preencha as informações para adicionar um novo campeonato.";
  const buttonText = championship ? "Salvar Alterações" : "Criar Campeonato";

  const bannerPreviewProps: ChampionBannerProps = {
    id: 'preview',
    campeonatoLogoUrl: watchAllFields.banner?.campeonatoLogoUrl || 'https://www.ogol.com.br/img/logos/edicoes/129979_imgbank_.png',
    campeonatoNome: watchAllFields.nome || 'Nome do Campeonato',
    campeaoGeralNome: 'EM BREVE',
    campeaoGeralAvatarUrl: 'https://picsum.photos/128/128',
    modoEquipes: watchAllFields.modoEquipes,
    palpiteiroNome: 'EM BREVE',
    palpiteiroAvatarUrl: 'https://picsum.photos/128/128',
    displayMode: watchAllFields.banner?.displayMode || 'photo_and_names',
    backgroundUrl: watchAllFields.banner?.backgroundUrl,
    banner: {
      titleColor: watchAllFields.banner?.titleColor,
      subtitleColor: watchAllFields.banner?.subtitleColor,
      namesColor: watchAllFields.banner?.namesColor,
    }
  };
  
  const rankingPositions = [
        { key: 'pos1', label: '1º Lugar (Campeão)' },
        { key: 'pos2', label: '2º Lugar (Vice-campeão)' },
        { key: 'pos3', label: '3º Lugar' },
        { key: 'pos4', label: '4º Lugar' },
        { key: 'pos5', label: '5º Lugar' },
    ];
    
  const getFilteredRankingOptions = (currentKey: string) => {
    const selectedValues = Object.entries(finalRankingValues)
        .filter(([key]) => key !== currentKey)
        .map(([, value]) => value)
        .filter(Boolean);

    return teamOptionsForRanking.filter(option => !selectedValues.includes(option.value));
  };
  
  const tiebreakerOptions: { id: TiebreakerRule, label: string, description: string }[] = [
    { id: 'maiorNumeroExatos', label: 'Maior Nº de Buchas', description: 'Quem acertou mais placares exatos.' },
    { id: 'maiorNumeroSituacoes', label: 'Maior Nº de Situações', description: 'Quem acertou mais vencedores/empates.' },
    { id: 'primeiraBucha', label: 'Primeira Bucha', description: 'Quem acertou um placar exato primeiro no campeonato.' },
  ];

  const handleTiebreakerChange = (ruleId: TiebreakerRule) => {
    const currentRules = form.getValues('regrasDesempate') || [];
    const newRules = currentRules.includes(ruleId)
      ? currentRules.filter(id => id !== ruleId)
      : [...currentRules, ruleId];
    form.setValue('regrasDesempate', newRules, { shouldValidate: true });
  };


  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <TooltipProvider>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-6 md:max-w-3xl mx-auto">
                    <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="general"><ClipboardList className="md:mr-2" /><span className="hidden md:inline">Gerais</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent><p>Gerais</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="rules"><Gavel className="md:mr-2" /><span className="hidden md:inline">Regras</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent><p>Regras</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="teams"><Shield className="md:mr-2" /><span className="hidden md:inline">Equipes</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent><p>Equipes</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="participants" disabled={isChampionshipStarted && !!championship}><Users className="md:mr-2" /><span className="hidden md:inline">Participantes</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent>
                            {isChampionshipStarted && !!championship ? (
                                <p>Não é possível editar participantes após o início do campeonato.</p>
                            ) : (
                                <p>Participantes</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="scoring"><Percent className="md:mr-2" /><span className="hidden md:inline">Pontuação</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent><p>Pontuação</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild><TabsTrigger value="banner"><ImageIcon className="md:mr-2" /><span className="hidden md:inline">Banner</span></TabsTrigger></TooltipTrigger>
                        <TooltipContent><p>Banner</p></TooltipContent>
                    </Tooltip>
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
                                <FormItem>
                                <FormLabel>Tipo do Campeonato</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo do campeonato" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="liga">Liga (Pontos Corridos)</SelectItem>
                                        <SelectItem value="copa">Copa (Mata-mata)</SelectItem>
                                        <SelectItem value="avulso">Jogos Avulsos (Amistosos)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="modoEquipes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Modo de Equipes</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o modo de equipes" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="times">Times (Clubes)</SelectItem>
                                        <SelectItem value="selecao">Seleções Nacionais</SelectItem>
                                        <SelectItem value="mista">Mista (Clubes e Seleções)</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        <FormItem>
                                        <FormLabel>Estrutura do Campeonato</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione a estrutura" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="fases">Baseado em Fases (Mata-mata)</SelectItem>
                                                <SelectItem value="rodadas">Baseado em Rodadas</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                    <TabsContent value="rules" className="space-y-6">
                        <Card>
                             <CardHeader>
                                <h3 className="text-lg font-semibold">Critérios de Desempate</h3>
                                <p className="text-sm text-muted-foreground">
                                    Selecione os critérios para desempate no ranking e ordene-os por prioridade. O critério com prioridade 1 será usado primeiro.
                                </p>
                             </CardHeader>
                             <CardContent className="space-y-4">
                                {(watchAllFields.regrasDesempate || []).map((ruleId, index) => {
                                    const rule = tiebreakerOptions.find(o => o.id === ruleId);
                                    if (!rule) return null;
                                    return (
                                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-lg">{index + 1}º</span>
                                                <div>
                                                    <p className="font-medium">{rule.label}</p>
                                                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                                                </div>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleTiebreakerChange(rule.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                <Separator />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full">Adicionar Critério</Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar critério..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhum critério encontrado.</CommandEmpty>
                                                <CommandGroup>
                                                    {tiebreakerOptions.map((option) => {
                                                        const isSelected = (watchAllFields.regrasDesempate || []).includes(option.id);
                                                        return (
                                                            <CommandItem
                                                                key={option.id}
                                                                onSelect={() => handleTiebreakerChange(option.id)}
                                                                className="flex justify-between"
                                                                disabled={isSelected}
                                                            >
                                                                {option.label}
                                                                <Checkbox checked={isSelected} className="mr-2" />
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                             </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="p-4">
                                <FormField
                                    control={form.control}
                                    name="incluirFantasma"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <Bot className="w-4 h-4 text-primary" />
                                                    Incluir Jogador Fantasma (IA)
                                                </FormLabel>
                                                <FormDescription>
                                                    Adiciona um jogador controlado por IA a este campeonato como homenagem.
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
                        </Card>
                    </TabsContent>
                    <TabsContent value="teams" className="space-y-4">
                        <Card>
                            <CardHeader className="p-4">
                               <div className="flex items-center justify-between">
                                 <div>
                                    <h3 className="text-md font-medium">Equipes Participantes</h3>
                                    <p className="text-sm text-muted-foreground">Selecione as equipes que fazem parte deste campeonato.</p>
                                </div>
                                <Badge variant="secondary">{selectedTeamIds.length} selecionada(s)</Badge>
                               </div>
                                <div className="relative mt-4">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar equipe..."
                                        className="pl-8"
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <FormField
                                    control={form.control}
                                    name="teamIds"
                                    render={() => (
                                        <FormItem>
                                        <ScrollArea className="h-72 w-full rounded-md border">
                                            <div className="p-4 space-y-2">
                                                {availableTeams.length > 0 ? availableTeams.map((team) => (
                                                    <FormField
                                                        key={team.id}
                                                        control={form.control}
                                                        name="teamIds"
                                                        render={({ field }) => (
                                                        <FormItem
                                                            key={team.id}
                                                            className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-muted"
                                                        >
                                                            <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(team.id)}
                                                                onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), team.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== team.id
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                            </FormControl>
                                                            <Label className="font-normal w-full flex items-center gap-3">
                                                                <Image src={team.crestUrl} alt="" width={24} height={24} className="object-contain" />
                                                                {team.name}
                                                            </Label>
                                                        </FormItem>
                                                        )}
                                                    />
                                                )) : <p className="text-center text-sm text-muted-foreground">Nenhuma equipe encontrada.</p>}
                                            </div>
                                        </ScrollArea>
                                        <FormMessage className="p-4" />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="participants" className="space-y-4">
                         <Card>
                            <CardHeader className="p-4">
                               <div className="flex items-center justify-between">
                                 <div>
                                    <h3 className="text-md font-medium">Usuários Participantes</h3>
                                    <p className="text-sm text-muted-foreground">Selecione os usuários que poderão palpitar neste campeonato.</p>
                                </div>
                                <Badge variant="secondary">{selectedParticipantIds.length} selecionado(s)</Badge>
                               </div>
                                <div className="relative mt-4">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nome ou apelido..."
                                        className="pl-8"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <FormField
                                    control={form.control}
                                    name="participantes"
                                    render={() => (
                                        <FormItem>
                                        <ScrollArea className="h-72 w-full rounded-md border">
                                            <div className="p-4 space-y-2">
                                                {availableUsers.length > 0 ? availableUsers.map((user) => (
                                                    <FormField
                                                        key={user.id}
                                                        control={form.control}
                                                        name="participantes"
                                                        render={({ field }) => (
                                                        <FormItem
                                                            key={user.id}
                                                            className="flex flex-row items-center space-x-3 space-y-0 rounded-md p-2 hover:bg-muted"
                                                        >
                                                            <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(user.id)}
                                                                onCheckedChange={(checked) => {
                                                                return checked
                                                                    ? field.onChange([...(field.value || []), user.id])
                                                                    : field.onChange(
                                                                        field.value?.filter(
                                                                        (value) => value !== user.id
                                                                        )
                                                                    )
                                                                }}
                                                            />
                                                            </FormControl>
                                                            <Label className="font-normal w-full flex items-center gap-3">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                    <AvatarFallback>{user.apelido.substring(0, 2)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold">{user.apelido}</span>
                                                                    <span className="text-xs text-muted-foreground">{user.nome}</span>
                                                                </div>
                                                            </Label>
                                                        </FormItem>
                                                        )}
                                                    />
                                                )) : <p className="text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</p>}
                                            </div>
                                        </ScrollArea>
                                        <FormMessage className="p-4" />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
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
                                                <Input type="number" placeholder="Ex: 6" {...field} />
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
                                                <Input type="number" placeholder="Ex: 3" {...field} />
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
                                    <p className="text-sm text-muted-foreground">Aposta extra no total de gols da partida.</p>
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
                                 <div className="space-y-4 rounded-lg border p-4" style={{ opacity: isComboActive ? 1 : 0.5 }}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="pontuacao.combo.pontosGols"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Bônus de Gols (Sozinho)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 1" {...field} disabled={!isComboActive} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormDescription className="text-xs">Pontos se acertar apenas o total de gols.</FormDescription>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pontuacao.combo.bonusPlacarExatoGols"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel>Bônus (Bucha + Gols)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 5" {...field} disabled={!isComboActive} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormDescription className="text-xs">Pontos SOMADOS à bucha se acertar ambos.</FormDescription>
                                                <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Separator />
                                     <div>
                                        <h4 className="font-medium text-sm mb-2">Fichas de Combo por Fase/Rodada</h4>
                                        <p className="text-xs text-muted-foreground mb-4">Defina quantas "Fichas de Combo" cada usuário terá disponível para usar em cada etapa.</p>
                                        <div className="space-y-2">
                                            {availablePhasesForCombo.map(phaseName => (
                                                <FormField
                                                    key={phaseName}
                                                    control={form.control}
                                                    name={`pontuacao.combo.cotasPorFase`}
                                                    render={({ field }) => {
                                                        const cota = field.value?.find(c => c.fase === phaseName);
                                                        const cotaIndex = field.value?.findIndex(c => c.fase === phaseName);
                                                        
                                                        return (
                                                            <FormItem className="flex items-center justify-between gap-4">
                                                                <FormLabel className="min-w-fit">{phaseName}</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        className="w-24 h-8"
                                                                        placeholder="0"
                                                                        disabled={!isComboActive}
                                                                        value={cota?.quantidade ?? ''}
                                                                        onChange={(e) => {
                                                                            const newValue = e.target.value;
                                                                            const currentCotas = field.value || [];
                                                                            const newCotas = [...currentCotas];
                                                                            const newQuantity = newValue === '' ? 0 : parseInt(newValue, 10);
                                                                            
                                                                            if (cotaIndex !== -1 && cotaIndex !== undefined) {
                                                                                newCotas[cotaIndex] = { ...newCotas[cotaIndex], quantidade: newQuantity };
                                                                            } else {
                                                                                newCotas.push({ fase: phaseName, quantidade: newQuantity });
                                                                            }
                                                                            
                                                                            field.onChange(newCotas);
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                     </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="p-4">
                                <FormField
                                    control={form.control}
                                    name="predictionAssist.active"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base flex items-center gap-2">
                                                    <BrainCircuit className="w-4 h-4 text-primary" />
                                                    Assistência de IA nos Palpites
                                                </FormLabel>
                                                <FormDescription>
                                                    Permite que usuários consultem a IA para obter sugestões de palpites neste campeonato.
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
                                            <FormItem>
                                                <FormLabel>Modo de Exibição do Banner</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isBannerActive}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione o modo de exibição" />
                                                    </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="photo_and_names">Foto e Nomes</SelectItem>
                                                        <SelectItem value="names_only">Apenas Nomes</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="banner.titleColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cor do Título</FormLabel>
                                                    <FormControl>
                                                        <Input type="color" {...field} value={field.value || '#FFFFFF'} disabled={!isBannerActive} className="p-1 h-10"/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="banner.subtitleColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cor do Subtítulo</FormLabel>
                                                    <FormControl>
                                                         <Input type="color" {...field} value={field.value || '#FBBF24'} disabled={!isBannerActive} className="p-1 h-10"/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="banner.namesColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cor dos Nomes</FormLabel>
                                                    <FormControl>
                                                         <Input type="color" {...field} value={field.value || '#FFFFFF'} disabled={!isBannerActive} className="p-1 h-10"/>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={!isBannerActive}>
                                        <Eye className="mr-2 h-4 w-4"/>
                                        Pré-visualizar Banner
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="space-y-6" style={{ opacity: isBannerActive ? 1 : 0.5 }}>
                            <Separator />
                            <Card className="border-dashed">
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
                                                        Permite que usuários palpitem no ranking final.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                        disabled={!isBannerActive}
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

                            {championship && isBannerActive && (
                                <Card className="border-dashed">
                                    <CardHeader className="p-4">
                                        <h3 className="text-base font-semibold">Classificação Final do Campeonato</h3>
                                        <p className="text-sm text-muted-foreground">Insira a ordem final para encerrar e premiar.</p>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-4">
                                        {rankingPositions.map(pos => (
                                            <FormField
                                                key={pos.key}
                                                control={form.control}
                                                name={`finalRanking.${pos.key as ('pos1' | 'pos2' | 'pos3' | 'pos4' | 'pos5')}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{pos.label}</FormLabel>
                                                        <FormControl>
                                                            <Combobox
                                                                options={getFilteredRankingOptions(pos.key)}
                                                                value={field.value || ''}
                                                                onChange={field.onChange}
                                                                placeholder="Selecione a equipe..."
                                                                searchPlaceholder="Buscar equipe..."
                                                                notFoundMessage="Nenhuma equipe encontrada."
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
            </TooltipProvider>
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
                    className="relative bg-cover bg-center"
                    style={{ 
                        backgroundImage: `url(${watchAllFields.banner?.backgroundUrl || 'https://images.unsplash.com/photo-1517433670267-382b363a7de4?q=80&w=2070&auto=format&fit=crop'})`,
                    }}
                >
                    <ChampionBanner {...bannerPreviewProps} />
                </div>
        </DialogContent>
    </Dialog>
  </>
  );
}

    