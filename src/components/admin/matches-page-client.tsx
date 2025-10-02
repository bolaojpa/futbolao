

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, differenceInHours, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, CalendarCheck, ChevronLeft, ChevronRight, AlarmClock, Calendar, Swords, PlusCircle, MoreHorizontal, Pencil, Trash2, ChevronDown, Trophy, Zap, Gem, Goal } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Match, Championship, Team, UserType, Prediction } from '@/lib/types';
import { getChampionships, deleteMatch, getTeams, getUsers } from '@/lib/firebase/firestore';
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
  const [currentTime, setCurrentTime] = useState(new Date());

   useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      setIsLoading(true);
      const fetchData = async () => {
          try {
              const [championshipsData, teamsData, usersData] = await Promise.all([
                  getChampionships(),
                  getTeams(),
                  getUsers(),
              ]);
              setChampionships(championshipsData);
              setTeams(teamsData);
              setUsers(usersData);
              if (championshipIdFromQuery) {
                  setSelectedChampionship(championshipIdFromQuery);
              } else if (championshipsData.length > 0) {
                  setSelectedChampionship(championshipsData[0].id);
              }
          } catch (error) {
              toast({ title: 'Erro ao carregar dados iniciais', variant: 'destructive' });
          } finally {
              setIsLoading(false);
          }
      };
      fetchData();
  }, [championshipIdFromQuery, toast]);

  // Real-time listeners
  useEffect(() => {
      const qMatches = query(collection(db, 'matches'), where('status', 'in', ['Agendado', 'Ao Vivo']));
      const unsubMatches = onSnapshot(qMatches, (snapshot) => {
          const matchesData: Match[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
          setAllMatches(matchesData);
      });

      const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
           const predictionsData: Prediction[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
           setAllPredictions(predictionsData);
      });

      return () => {
        unsubMatches();
        unsubPredictions();
      };
  }, []);

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
            const participants = championship?.participantes || [];
            const totalParticipants = participants.length;
            
            const predictedUserIds = new Set(match.predictions.map(p => p.userId));
            const missingUsers = participants
                .map(pId => users.find(u => u.id === pId))
                .filter(u => u && !predictedUserIds.has(u.id));
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
                        <ChevronDown className="h-4 w-4 mx-auto" />
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="bg-background/80 border-t">
                             <div className="text-center p-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <h4 className={cn("font-semibold flex items-center justify-center gap-2", hasMissingPredictions && "cursor-help")}>
                                                <Users className="w-4 h-4" /> 
                                                Palpites dos Usuários ({match.predictions.length}/{totalParticipants})
                                            </h4>
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
                            </div>
                            {match.predictions.length > 0 ? (
                                <ul className="text-sm">
                                {match.predictions.map((prediction, i) => {
                                    const user = users.find(u => u.id === prediction.userId);
                                    if (!user) return null;

                                    return (
                                    <li key={i} className="flex justify-between items-center p-4 border-t">
                                        <div className="w-1/3 text-left flex items-center gap-2 group">
                                            <div className="relative">
                                                <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                </Avatar>
                                                <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5">
                                                <span className="font-bold">{user.apelido}:</span>
                                                 {championship?.championPredictionSettings?.active && (() => {
                                                    const champPicks = user.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                    const chosenTeams = champPicks ? champPicks.teams.map((teamName, index) => {
                                                        const team = teams.find(t => t.name === teamName);
                                                        const isEliminated = (championship.finalRanking ? Object.values(championship.finalRanking) : []).length > 0 && !(championship.finalRanking ? Object.values(championship.finalRanking) : []).includes(teamName);
                                                        return team ? { ...team, pickOrder: index + 1, isEliminated: isEliminated } : null;
                                                    }).filter((t): t is Team & { pickOrder: number; isEliminated: boolean; } => t !== null) : [];

                                                    if (chosenTeams.length === 0) return null;

                                                    return (
                                                        <>
                                                            <div className="hidden sm:flex items-center gap-1">
                                                                {chosenTeams.map(team => (
                                                                    <Tooltip key={team.id}>
                                                                        <TooltipTrigger>
                                                                            <Image src={team.crestUrl} alt={team.name} width={16} height={16} className={cn("object-contain", team.isEliminated && "opacity-30")} />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent><p>Opção {team.pickOrder}: {team.name}</p></TooltipContent>
                                                                    </Tooltip>
                                                                ))}
                                                            </div>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <div className="sm:hidden flex items-center gap-1 cursor-pointer">
                                                                        <Trophy className="w-4 h-4 text-amber-500" />
                                                                    </div>
                                                                </PopoverTrigger>
                                                                <PopoverContent className='w-auto p-2'>
                                                                    <div className='flex flex-col gap-1'>
                                                                        <p className="font-semibold text-sm">Palpites de Campeão</p>
                                                                        {chosenTeams.map(team => (
                                                                            <div key={team.id} className='flex items-center gap-2'>
                                                                                <Image src={team.crestUrl} alt={team.name} width={16} height={16} className={cn("object-contain", team.isEliminated && "opacity-30")} />
                                                                                <p className="text-xs">{team.pickOrder}º: {team.name}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    <div className="w-1/3 flex justify-center font-mono font-semibold text-base relative">
                                        <div className="flex-1 text-center">
                                            <span>{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                        </div>
                                        {championship?.pontuacao.combo?.ativo && prediction.palpiteCombo && (
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
                                        {/* A pontuação só é exibida no histórico */}
                                    </div>
                                    </li>
                                )})}
                                </ul>
                            ) : (
                                <div className="text-center p-4 text-muted-foreground">
                                    Nenhum palpite registrado para esta partida ainda.
                                </div>
                            )}
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
