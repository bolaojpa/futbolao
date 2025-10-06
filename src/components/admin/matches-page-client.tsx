

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, differenceInHours, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, CalendarCheck, ChevronLeft, ChevronRight, AlarmClock, Calendar, Swords, PlusCircle, MoreHorizontal, Pencil, Trash2, ChevronDown, Trophy, Zap, Gem, Goal, Ghost } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/shared/countdown';
import { MatchForm } from '@/components/admin/match-form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Match, Championship, Team, UserType, Prediction } from '@/lib/types';
import { deleteMatch } from '@/lib/firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ITEMS_PER_PAGE = 10;

const UpcomingMatchDate = ({ matchDateString }: { matchDateString: string }) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => setIsClient(true), []);

    if (!isClient) {
        return null;
    }
    
    const matchDate = parseISO(matchDateString);
    if (isPast(matchDate)) {
        return (
             <Badge variant='destructive' className='animate-pulse'>
                <Zap className="w-3 h-3 mr-1.5" />
                Ao Vivo
            </Badge>
        )
    }

    const now = new Date();
    const hoursDiff = differenceInHours(matchDate, now);

    if (hoursDiff < 1) {
      return (
         <div className="text-xs font-semibold text-accent flex items-center justify-center gap-2">
           <AlarmClock className="w-4 h-4"/>
           <Countdown targetDate={matchDateString} />
        </div>
      )
    }

    if (hoursDiff < 2) {
      return (
        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <AlarmClock className="w-3 h-3"/>
          {`Em breve às ${format(matchDate, "HH:mm", { locale: ptBR })}`}
        </div>
      );
    }
    
    if (isToday(matchDate)) {
      return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{`Hoje às ${format(matchDate, "HH:mm", { locale: ptBR })}`}</div>;
    }

    return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{format(matchDate, "eeee, dd/MM 'às' HH:mm", { locale: ptBR })}</div>;
};

export function AdminMatchesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const championshipIdFromQuery = searchParams.get('championshipId');
  
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);

  const [selectedChampionship, setSelectedChampionship] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const unsubChampionships = onSnapshot(collection(db, 'championships'), (snap) => {
        const championshipsData = snap.docs.map(d => ({id: d.id, ...d.data()}) as Championship);
        setChampionships(championshipsData);
        if (championshipIdFromQuery) {
            setSelectedChampionship(championshipIdFromQuery);
        } else if (championshipsData.length > 0) {
            setSelectedChampionship(championshipsData[0].id);
        }
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}) as Team)));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}) as UserType)));
    
    const qMatches = query(collection(db, 'matches'), where('status', 'in', ['Agendado', 'Ao Vivo']));
    const unsubMatches = onSnapshot(qMatches, (snap) => setAllMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match))));

    const unsubPredictions = onSnapshot(collection(db, "predictions"), (snap) => {
        setAllPredictions(snap.docs.map(d => ({id: d.id, ...d.data()}) as Prediction));
        setIsLoading(false);
    });

    return () => {
        unsubChampionships();
        unsubTeams();
        unsubUsers();
        unsubMatches();
        unsubPredictions();
    };
  }, [championshipIdFromQuery]);

  const matchesWithPredictions = useMemo(() => {
    return allMatches.map(match => ({
      ...match,
      predictions: allPredictions.filter(p => p.matchId === match.id)
    }));
  }, [allMatches, allPredictions]);


  const sortedMatches = useMemo(() => {
    return [...matchesWithPredictions]
      .filter(match => selectedChampionship === 'all' || match.campeonatoId === selectedChampionship)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [selectedChampionship, matchesWithPredictions]);

    const getChampionPickWinner = useMemo(() => {
        const cache: Record<string, { winnerIds: string[]; validPicks: Record<string, string[]> }> = {};
    
        return (championship: Championship): { winnerIds: string[]; validPicks: Record<string, string[]> } => {
            if (cache[championship.id]) return cache[championship.id];
            if (!championship.finalRanking || !championship.championPredictionSettings?.active) return { winnerIds: [], validPicks: {} };
    
            const finalRankingOrder = Object.values(championship.finalRanking).filter(Boolean) as string[];
            if (finalRankingOrder.length === 0) return { winnerIds: [], validPicks: {} };
    
            let candidates: UserType[] = [];
            let bestTier = { rank: Infinity, pick: Infinity };

            for (let rankIndex = 0; rankIndex < finalRankingOrder.length; rankIndex++) {
                const rankedTeam = finalRankingOrder[rankIndex];
                for (let pickIndex = 0; pickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); pickIndex++) {
                    const contenders = users.filter(u =>
                        u.championPicks?.some(p => p.championshipId === championship.id && p.teams[pickIndex] === rankedTeam)
                    );
                    if (contenders.length > 0) {
                        bestTier = { rank: rankIndex, pick: pickIndex };
                        candidates = contenders;
                        break; 
                    }
                }
                if (candidates.length > 0) break;
            }

            if (candidates.length > 1) {
                for (let nextPickIndex = 0; nextPickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); nextPickIndex++) {
                    if (candidates.length <= 1) break;
                    if (nextPickIndex === bestTier.pick) continue;

                    let bestNextRank = Infinity;
                    const nextPickWinners: { user: UserType; rank: number }[] = [];

                    for (const user of candidates) {
                        const userPick = user.championPicks?.find(p => p.championshipId === championship.id)?.teams[nextPickIndex];
                        if (userPick) {
                            const rank = finalRankingOrder.indexOf(userPick);
                            if (rank !== -1) {
                                nextPickWinners.push({ user, rank });
                                bestNextRank = Math.min(bestNextRank, rank);
                            }
                        }
                    }
                    if(nextPickWinners.length > 0) {
                        const newTiedUsers = nextPickWinners.filter(w => w.rank === bestNextRank).map(w => w.user);
                        if (newTiedUsers.length > 0) {
                            candidates = newTiedUsers;
                        }
                    }
                }
            }
            
            if (candidates.length > 1) {
                const finalMatch = allMatches.filter(m => m.campeonatoId === championship.id && m.fase.toLowerCase().includes('final')).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                if (finalMatch) {
                    const buchaWinners = candidates.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'bucha' || p.acertoTipo === 'combo')));
                    if (buchaWinners.length > 0 && buchaWinners.length < candidates.length) {
                        candidates = buchaWinners;
                    } else {
                        const situationWinners = candidates.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'situacao' || p.acertoTipo === 'bonus')));
                        if (situationWinners.length > 0 && situationWinners.length < candidates.length) {
                            candidates = situationWinners;
                        }
                    }
                }
            }

            if (candidates.length > 1) {
                candidates.sort((a, b) => (new Date(a.dataCadastro as string).getTime()) - (new Date(b.dataCadastro as string).getTime()));
                candidates = [candidates[0]];
            }

            const validPicks: Record<string, string[]> = {};
            candidates.forEach(winner => {
                const winnerPicks = winner.championPicks?.find(p => p.championshipId === championship.id)?.teams || [];
                const correctPicksInSequence: string[] = [];
                for (let i = 0; i < winnerPicks.length; i++) {
                    if (winnerPicks[i] === finalRankingOrder[i]) {
                        correctPicksInSequence.push(winnerPicks[i]);
                    } else {
                        break; 
                    }
                }
                validPicks[winner.id] = correctPicksInSequence;
            });
            
            const result = { winnerIds: candidates.map(u => u.id), validPicks };
            cache[championship.id] = result;
            return result;
        };
    }, [users, allMatches, allPredictions]);


  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('championshipId', value);
    router.push(`${pathname}?${params.toString()}`);
    setSelectedChampionship(value);
    setCurrentPage(1); 
  };
  
  const handleCreate = () => {
    setEditingMatch(null);
    setIsFormOpen(true);
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    setIsFormOpen(true);
  };

  const handleDelete = async (matchId: string) => {
    try {
      await deleteMatch(matchId);
      toast({
          title: "Partida Excluída",
          description: "A partida foi removida com sucesso.",
      });
    } catch(err) {
       toast({ title: 'Erro ao excluir partida', variant: 'destructive' });
    }
  };

  const handleFormSubmit = async () => {
    setIsFormOpen(false);
  };

  const paginatedMatches = useMemo(() => {
     return sortedMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  }, [sortedMatches, currentPage]);

  const totalPages = Math.ceil(sortedMatches.length / ITEMS_PER_PAGE);
  
  if (isLoading) {
    return <div className="p-8"><div className="h-40 w-full bg-muted rounded-lg animate-pulse" /></div>
  }

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <CalendarCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Visualizar Palpites</h1>
          <p className="text-muted-foreground">
            Consulte os palpites enviados para as partidas agendadas.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-8 items-center">
          <Select value={selectedChampionship} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[280px] sm:max-w-xs [&>span]:truncate">
                  <SelectValue placeholder="Filtrar por campeonato" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos os Campeonatos</SelectItem>
                  {championships.map(champ => (
                      <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <div className="w-full sm:w-auto">
            <Button onClick={handleCreate} disabled={selectedChampionship === 'all'} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Partida
            </Button>
          </div>
      </div>

      <MatchForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen}
        onSubmitSuccess={handleFormSubmit}
        match={editingMatch}
        championshipId={editingMatch ? editingMatch.campeonatoId : selectedChampionship}
        championships={championships}
        teams={teams}
      />

      <div className="w-full space-y-4">
        {paginatedMatches.length > 0 ? (
          paginatedMatches.map((match) => {
            const championship = championships.find(c => c.id === match.campeonatoId);
            const participants = users.filter(u => championship?.participantes.includes(u.id));
            const totalParticipants = participants.length;
            
            const predictedUserIds = new Set(match.predictions.map(p => p.userId));
            const missingUsers = participants.filter(u => !predictedUserIds.has(u.id));
            const hasMissingPredictions = missingUsers.length > 0;

            const teamA = teams.find(t => t.name === match.timeA);
            const teamB = teams.find(t => t.name === match.timeB);

            return (
              <Accordion type="single" collapsible className="w-full" key={match.id}>
                <AccordionItem value={match.id} className="border-0">
                  <Card className={cn("relative", hasMissingPredictions && differenceInHours(parseISO(match.data), new Date()) < 48 && "animate-border-pulse border-blue-500/50")}>
                     <div className="absolute top-2 right-2 z-10">
                        <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Abrir menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(match)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação removerá permanentemente a partida "{match.timeA} vs {match.timeB}". Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(match.id)}>Sim, excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     </div>
                    <div className="p-4">
                      <div className="flex flex-col items-center justify-center w-full gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                            {championship?.iconUrl && <Image src={championship.iconUrl} alt="" width={16} height={16} />}
                            {match.campeonato} - {match.fase}
                        </div>
                        <div className="flex items-center justify-center w-full">
                            <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                <div className="h-14 w-14 flex items-center justify-center">
                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={64} height={64} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                </div>
                            </div>
                             <div className="flex items-center justify-center text-muted-foreground mx-4">
                                <Swords className="h-6 w-6" />
                            </div>
                            <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                <div className="h-14 w-14 flex items-center justify-center">
                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={64} height={64} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                </div>
                                <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                            </div>
                        </div>
                        <div className='flex flex-col items-center justify-center mt-2 gap-2'>
                           <UpcomingMatchDate matchDateString={match.data} />
                        </div>
                      </div>
                    </div>
                    <AccordionTrigger className="w-full p-2 border-t hover:bg-muted/50">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center justify-center w-full relative group/trigger">
                                        <h4 className={cn("font-semibold flex items-center justify-center gap-2", hasMissingPredictions && "cursor-help")}>
                                            <Users className="w-4 h-4" /> 
                                            Palpites ({match.predictions.length}/{totalParticipants})
                                        </h4>
                                        <ChevronDown className="h-4 w-4 absolute right-4 top-1/2 -translate-y-1/2 group-data-[state=open]/trigger:rotate-180 transition-transform" />
                                    </div>
                                </TooltipTrigger>
                                {hasMissingPredictions && (
                                    <TooltipContent>
                                        <p className="font-semibold">Palpites Pendentes:</p>
                                        <ul className="list-disc list-inside">
                                            {missingUsers.map(user => user && <li key={user.id}>{user.apelido}</li>)}
                                        </ul>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="bg-background/80 border-t">
                             <ul className="text-sm">
                                {participants.map((user) => {
                                    const prediction = match.predictions.find(p => p.userId === user.id);

                                     if (!prediction) {
                                        return (
                                            <li key={user.id} className="flex justify-between items-center p-4 border-t bg-orange-500/80 text-white">
                                                <div className="w-1/3 text-left">
                                                    <div className="flex items-center gap-2 group">
                                                        <Avatar className="w-8 h-8 opacity-70">
                                                            <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                            <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-bold">{user.apelido}:</span>
                                                    </div>
                                                </div>
                                                <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">? - ?</span>
                                                <div className="w-1/3 text-right">
                                                    <Badge variant="secondary">Sem Palpite</Badge>
                                                </div>
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={user.id} className="flex justify-between items-center p-4 border-t">
                                            <div className="w-1/3 text-left">
                                                <div className="flex items-center gap-2 group">
                                                    <div className="relative">
                                                        <Avatar className="w-8 h-8">
                                                        <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                        <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                        </Avatar>
                                                        <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col sm:items-center sm:flex-row sm:gap-1.5">
                                                            <span className="font-bold">{user.apelido}:</span>
                                                            <div className='flex items-center gap-1'>
                                                                <div className="sm:hidden">
                                                                    {championship?.championPredictionSettings?.active && (
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Trophy className="w-5 h-5 text-amber-500 cursor-pointer" />
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-48 p-2">
                                                                                <div className="space-y-1">
                                                                                    <p className="font-bold text-sm">Palpites de Campeão</p>
                                                                                    {user.championPicks?.find(pick => pick.championshipId === championship.id)?.teams.map((teamName, idx) => <span key={idx} className="block text-xs">{idx+1}º: {teamName}</span>)}
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    )}
                                                                </div>
                                                                <div className='hidden sm:flex items-center gap-1'>
                                                                    {user.championPicks?.find(p => p.championshipId === championship.id)?.teams.map((teamName, pickIndex) => {
                                                                        const team = teams.find(t => t.name === teamName);
                                                                        if (!team) return null;
                                                                        const winnerInfo = getChampionPickWinner(championship);
                                                                        const isWinner = winnerInfo.winnerIds.includes(user.id);
                                                                        const isPickValid = isWinner && winnerInfo.validPicks[user.id]?.includes(teamName);
                                                                        
                                                                        return (
                                                                            <Tooltip key={team.id}>
                                                                                <TooltipTrigger>
                                                                                    <Image src={team.crestUrl} alt={team.name} width={16} height={16} className={cn("object-contain", !isPickValid && "opacity-30")} />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent><p>{team.name}</p></TooltipContent>
                                                                            </Tooltip>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                         {user.isGhost && <Ghost className="w-4 h-4 text-primary" />}
                                                    </div>
                                                </div>
                                            </div>
                                        <div className="w-1/3 flex justify-center font-mono font-semibold text-base relative">
                                            <div className="flex-1 text-center">
                                                <span>{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                            </div>
                                            {championship?.pontuacao.combo?.ativo && prediction?.palpiteCombo && (
                                                <div className="absolute right-0 sm:left-full sm:ml-2 flex items-center gap-1">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <div className="flex items-center gap-1">
                                                                    <Goal className="h-4 w-4" />
                                                                    <span>{prediction.palpiteCombo.totalGols}</span>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Palpite de Gols (Combo)</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3 text-right">
                                            <Badge variant="secondary">Palpite Salvo</Badge>
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
          })
        ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Nenhuma partida agendada para o campeonato selecionado.</p>
                </CardContent>
            </Card>
        )}
      </div>

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
