

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, History, ChevronLeft, ChevronRight, Trophy, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Match, Prediction, Championship, UserType, Team } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getChampionships, getMatches, getPredictionsForUser, getUsers, getTeams } from '@/lib/firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';


type FilterType = 'all' | 'exact' | 'situation' | 'miss';
const ITEMS_PER_PAGE = 5;

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      // Formata a data apenas no cliente
      setFormattedDate(format(parseISO(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      // Retorna um placeholder ou nada enquanto a data não é formatada no cliente
      return null; 
    }
  
    return <span className="text-xs text-muted-foreground">{formattedDate}</span>;
};

interface MatchWithPrediction extends Match {
    prediction?: Prediction;
    otherPredictions: Prediction[];
}

export default function HistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const championshipIdFromQuery = searchParams.get('championshipId');
  const matchIdFromQuery = searchParams.get('matchId');
  const filterTypeFromQuery = searchParams.get('filterType') as FilterType | null;

  const [selectedChampionship, setSelectedChampionship] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>(filterTypeFromQuery || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const matchRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    async function fetchData() {
        if (!user) return;
        setLoadingData(true);
        try {
            const [champs, matches, users, teams, userPreds, allPreds] = await Promise.all([
                getChampionships(),
                getMatches(),
                getUsers(),
                getTeams(),
                getPredictionsForUser(user.id),
                getDocs(collection(db, 'predictions')).then(snap => snap.docs.map(d => d.data() as Prediction)),
            ]);
            setChampionships(champs);
            setAllMatches(matches.filter(m => m.status === 'Finalizado'));
            setAllUsers(users);
            setAllTeams(teams);
            setUserPredictions(userPreds);
            setAllPredictions(allPreds);

            if (championshipIdFromQuery) {
              setSelectedChampionship(championshipIdFromQuery);
            } else if (champs.length > 0) {
              setSelectedChampionship(champs[0].id);
            }

        } catch (error) {
            console.error("Error fetching history data:", error);
        } finally {
            setLoadingData(false);
        }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, championshipIdFromQuery]);
  
  // Sincroniza o estado com os parâmetros da URL, caso eles mudem.
  useEffect(() => {
    if (championshipIdFromQuery) {
      setSelectedChampionship(championshipIdFromQuery);
    }
    if (filterTypeFromQuery) {
      setFilterType(filterTypeFromQuery);
    }
  }, [championshipIdFromQuery, filterTypeFromQuery]);

  const matchesWithUserPrediction = useMemo<MatchWithPrediction[]>(() => {
    return allMatches
      .map(match => {
        const prediction = userPredictions.find(p => p.matchId === match.id);
        const otherPredictions = allPredictions.filter(p => p.matchId === match.id && p.userId !== user?.id);
        return { ...match, prediction, otherPredictions };
      })
      .filter((m): m is MatchWithPrediction & { prediction: Prediction } => !!m.prediction);
  }, [allMatches, userPredictions, allPredictions, user]);


  const filteredMatches = useMemo(() => matchesWithUserPrediction
    .filter(match => {
        if (!selectedChampionship) return true; // Show all if no championship is selected

        // Primeiro, filtra pelo campeonato
        const championshipMatch = match.campeonatoId === selectedChampionship;
        if (!championshipMatch) return false;

        // Depois, pelo tipo de acerto
        const prediction = match.prediction!;
        const champ = championships.find(c => c.id === match.campeonatoId);
        const maxPontos = champ?.pontuacao.tradicional.exato ?? 0;

        switch (filterType) {
            case 'exact':
                return prediction.pontos === maxPontos && maxPontos > 0;
            case 'situation':
                return prediction.pontos > 0 && prediction.pontos < maxPontos;
            case 'miss':
                return prediction.pontos === 0;
            case 'all':
            default:
                return true;
        }
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()), [selectedChampionship, filterType, matchesWithUserPrediction, championships]);


  useEffect(() => {
    if(loadingData) return;

    const matchIdToScroll = matchIdFromQuery || window.location.hash.substring(1);
    
    if (matchIdToScroll) {
        // Encontrar a página correta para a partida
        const matchIndex = filteredMatches.findIndex(m => m.id === matchIdToScroll);

        if (matchIndex !== -1) {
            const targetPage = Math.ceil((matchIndex + 1) / ITEMS_PER_PAGE);
            if (currentPage !== targetPage) {
                setCurrentPage(targetPage);
                // A rolagem será acionada pelo próximo useEffect que observa currentPage
                return;
            }
        }
        
        // Se já estivermos na página certa, ou se a página foi definida agora, rolar
        setTimeout(() => { 
            const element = matchRefs.current[matchIdToScroll];
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }, 100);
    }
}, [matchIdFromQuery, filteredMatches, currentPage, loadingData]);
  
  
  const handleFilterChange = (type: 'championship' | 'filterType', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (type === 'championship') {
        params.set('championshipId', value);
        setSelectedChampionship(value);
    } else {
        params.set('filterType', value);
        setFilterType(value as FilterType);
    }
    
    params.delete('matchId');
    router.push(`${pathname}?${params.toString()}`);
    setCurrentPage(1); // Sempre reseta para a primeira página ao mudar o filtro
  };


  // Lógica de Paginação e Agrupamento
  const groupedAndPaginatedMatches = useMemo(() => {
    const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE); 
    
    const paginatedItems = filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
     const paginatedGrouped = paginatedItems.reduce((acc, match) => {
        const phase = match.fase || 'Resultados Gerais';
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push(match);
        return acc;
    }, {} as Record<string, MatchWithPrediction[]>);

    return { paginatedItems: paginatedGrouped, totalPages };
  }, [filteredMatches, currentPage]);


  const { paginatedItems, totalPages } = groupedAndPaginatedMatches;

  const getPredictionStatusClass = (pontos: number, maxPontos: number) => {
    if (pontos === maxPontos && maxPontos > 0) return 'bg-green-100/80 dark:bg-green-900/40';
    if (pontos > 0) return 'bg-blue-100/80 dark:bg-blue-900/40';
    return 'bg-red-100/80 dark:bg-red-900/40';
  };

  const getPointsBadgeVariant = (pontos: number, maxPontos: number): "success" | "default" | "destructive" => {
    if (pontos === maxPontos && maxPontos > 0) return 'success';
    if (pontos > 0) return 'default';
    return 'destructive';
  };

  if (loadingData || !user) {
    return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Histórico de Palpites</h1>
          <p className="text-muted-foreground">
            Reveja seus palpites passados e suas pontuações.
          </p>
        </div>
      </div>
      
       <div className="flex flex-col md:flex-row gap-2 mb-8">
          <Select value={selectedChampionship || ''} onValueChange={(v) => handleFilterChange('championship', v)}>
              <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filtrar por campeonato" />
              </SelectTrigger>
              <SelectContent>
                  {championships.map(champ => (
                      <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
           <Select value={filterType} onValueChange={(v) => handleFilterChange('filterType', v)}>
              <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Mostrar Todos</SelectItem>
                  <SelectItem value="exact">Acertos de Placar Exato</SelectItem>
                  <SelectItem value="situation">Acertos de Situação</SelectItem>
                  <SelectItem value="miss">Errados</SelectItem>
              </SelectContent>
          </Select>
      </div>

    <TooltipProvider>
      <div className="w-full space-y-4">
        {Object.keys(paginatedItems).length > 0 ? (
          Object.entries(paginatedItems).map(([phase, matches]) => (
            <div key={phase} className="space-y-4">
              <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
              {matches.map((match) => {
                const prediction = match.prediction!;
                const teamA = allTeams.find(t => t.name === match.timeA);
                const teamB = allTeams.find(t => t.name === match.timeB);
                const champ = championships.find(c => c.id === match.campeonatoId);
                const isChampionshipStarted = champ ? isPast(parseISO(champ.dataInicio as string)) : false;
                const maxPointsForMatch = champ?.pontuacao.tradicional.exato ?? 0;

                return (
                  <Accordion type="single" collapsible className="w-full" key={match.id}>
                    <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                      <Card>
                        <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction.pontos, maxPointsForMatch))}>
                          <div className="flex flex-col items-center justify-center w-full">
                            <div className="flex items-center justify-center w-full">
                              <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                {match.timeA}
                              </div>
                              <div className="flex items-center justify-center gap-3 md:gap-4">
                                <Image src={teamA?.crestUrl || "https://picsum.photos/48/48"} alt={`Bandeira ${match.timeA}`} width={48} height={40} className="object-contain" data-ai-hint="team logo" />
                                <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                <Image src={teamB?.crestUrl || "https://picsum.photos/48/48"} alt={`Bandeira ${match.timeB}`} width={48} height={40} className="object-contain" data-ai-hint="team logo" />
                              </div>
                              <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                {match.timeB}
                              </div>
                            </div>
                            <div className='flex flex-col items-center justify-center mt-2 gap-2'>
                              <Badge variant="secondary">{match.status}</Badge>
                              <FormattedDate dateString={match.data} />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos, maxPointsForMatch))}>
                            <div className="flex justify-between items-center w-full">
                                <div className="w-1/3 text-left flex items-center gap-2">
                                    <div className="relative">
                                      <Avatar className="w-8 h-8">
                                        <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                        <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                      </Avatar>
                                      <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                    </div>
                                    <span className="font-bold">Seu Palpite:</span>
                                </div>
                              <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                              <div className="w-1/3 text-right">
                                <Badge variant={getPointsBadgeVariant(prediction.pontos, maxPointsForMatch)} className='whitespace-nowrap'>
                                  {prediction.pontos} pts
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="bg-background/80 border-t">
                            <div className="text-center py-2">
                              <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Outros Palpites</h4>
                            </div>
                            <ul className="text-sm">
                              {match.otherPredictions.map((p, i) => {
                                const otherUser = allUsers.find(u => u.id === p.userId);
                                if (!otherUser) return null;
                                
                                const champPicks = otherUser.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                const chosenTeams = isChampionshipStarted && champPicks ? champPicks.teams.map((teamName, index) => {
                                    const team = allTeams.find(t => t.name === teamName);
                                    return team ? { ...team, pickOrder: index + 1 } : null;
                                }).filter(Boolean) : [];

                                const otherMaxPoints = championships.find(c => c.id === match.campeonatoId)?.pontuacao.tradicional.exato ?? 0;

                                return (
                                <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.pontos, otherMaxPoints))}>
                                  <div className="w-1/3 text-left">
                                      <Link href={`/dashboard/profile?userId=${p.userId}`} className="flex items-center gap-2 group">
                                      <div className="relative">
                                        <Avatar className="w-8 h-8">
                                          <AvatarImage src={otherUser.fotoPerfil} alt={otherUser.apelido} />
                                          <AvatarFallback>{otherUser.apelido.substring(0,2)}</AvatarFallback>
                                        </Avatar>
                                        <StatusIndicator status={otherUser.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold group-hover:underline">{otherUser.apelido}:</span>
                                         {chosenTeams.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                {chosenTeams.map(team => (
                                                    <Tooltip key={team!.id}>
                                                        <TooltipTrigger>
                                                              <Image src={team!.crestUrl} alt={team!.name} width={16} height={16} className="object-contain" />
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Opção {team!.pickOrder}: {team!.name}</p></TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        )}
                                      </div>
                                    </Link>
                                  </div>
                                  <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpiteUsuario.placarA}-{p.palpiteUsuario.placarB}</span>
                                  <div className="w-1/3 text-right">
                                    <Badge variant={getPointsBadgeVariant(p.pontos, otherMaxPoints)} className='whitespace-nowrap'>
                                      {p.pontos} pts
                                    </Badge>
                                  </div>
                                </li>
                              )})}
                            </ul>
                          </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          ))
        ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Nenhum resultado encontrado para os filtros selecionados.</p>
                </CardContent>
            </Card>
        )}
      </div>
      </TooltipProvider>

       {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
      )}
    </div>
  );
}
