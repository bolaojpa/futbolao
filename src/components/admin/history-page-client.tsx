

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
import { Users, History, ChevronLeft, ChevronRight, Trophy, MoreHorizontal, Trash2, Pencil, Save, AlertTriangle, Loader2, Goal, Gem } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Match, Championship, Team, UserType, Prediction } from '@/lib/types';
import { getChampionships, getMatches, updateMatch, deleteMatch, getTeams, getUsers, getPredictionsForMatch } from '@/lib/firebase/firestore';


const ITEMS_PER_PAGE = 10;

interface MatchWithPredictions extends Match {
    predictions: Prediction[];
}

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString, className }: { dateString: string, className?: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(parseISO(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <span className={cn("text-xs text-muted-foreground", className)}>{formattedDate}</span>;
};

export function AdminHistoryPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const championshipIdFromQuery = searchParams.get('championshipId');
  
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [matches, setMatches] = useState<MatchWithPredictions[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  
  const [selectedChampionship, setSelectedChampionship] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingScore, setEditingScore] = useState<{ placarA: string, placarB: string }>({ placarA: '0', placarB: '0' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const [championshipsData, matchesData, teamsData, usersData] = await Promise.all([
            getChampionships(),
            getMatches(),
            getTeams(),
            getUsers(),
        ]);
        
        const finalizedMatches = matchesData.filter(m => m.status === 'Finalizado');

        const matchesWithPredictions: MatchWithPredictions[] = await Promise.all(
            finalizedMatches.map(async (match) => {
                const predictions = await getPredictionsForMatch(match.id);
                return { ...match, predictions };
            })
        );
        
        setChampionships(championshipsData);
        setMatches(matchesWithPredictions);
        setTeams(teamsData);
        setUsers(usersData);
        
        if (championshipIdFromQuery) {
            setSelectedChampionship(championshipIdFromQuery);
        } else if (championshipsData.length > 0) {
            const activeChampionships = championshipsData.filter(c => c.status === 'ativo');
            if (activeChampionships.length > 0) {
                setSelectedChampionship(activeChampionships[0].id);
            } else {
                setSelectedChampionship('all');
            }
        } else {
            setSelectedChampionship('all');
        }

    } catch (error) {
        toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const filteredMatches = useMemo(() => [...matches]
    .filter(match => (selectedChampionship === 'all' || match.campeonatoId === selectedChampionship))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()), [selectedChampionship, matches]);


  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('championshipId', value);
    router.push(`${pathname}?${params.toString()}`);
    setSelectedChampionship(value);
    setCurrentPage(1); 
  };
  
  const handleOpenEditModal = (match: Match) => {
    setEditingMatch(match);
    setEditingScore({ 
        placarA: match.placarA?.toString() ?? '0',
        placarB: match.placarB?.toString() ?? '0'
    });
    setIsEditModalOpen(true);
  };

  const handleScoreChange = (team: 'placarA' | 'placarB', value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setEditingScore(prev => ({ ...prev, [team]: numericValue }));
  };
  
  const handleSaveScore = async () => {
    if (!editingMatch) return;

    try {
      await updateMatch(editingMatch.id, {
        placarA: Number(editingScore.placarA),
        placarB: Number(editingScore.placarB),
      });
      await fetchData(); // Re-fetches all data, including recalculated points implicitly
      toast({
          title: "Placar Atualizado",
          description: `O placar de ${editingMatch.timeA} vs ${editingMatch.timeB} foi alterado.`,
      });
      setIsEditModalOpen(false);
    } catch (error) {
        toast({ title: 'Erro ao salvar o placar', variant: 'destructive' });
    }
  };

  const handleDelete = async (matchId: string, matchName: string) => {
    try {
        await deleteMatch(matchId);
        await fetchData();
        toast({
            title: "Partida Excluída",
            description: `A partida "${matchName}" e seus palpites foram removidos.`,
            variant: "destructive",
        });
    } catch (error) {
         toast({ title: 'Erro ao excluir a partida', variant: 'destructive' });
    }
  };


  const calculatePoints = (match: Match, prediction: Prediction): number => {
      const { placarA: finalA, placarB: finalB } = match;
      const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
      const championship = championships.find(c => c.id === match.campeonatoId);
      const pontuacao = championship?.pontuacao.tradicional;

      if (finalA === undefined || finalA === null || finalB === undefined || finalB === null || !pontuacao) return 0;
      
      if (guessA === finalA && guessB === finalB) {
          return pontuacao.exato; // Acerto em cheio
      }

      const finalWinner = finalA > finalB ? 'A' : finalA < finalB ? 'B' : 'E';
      const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';

      if (finalWinner === guessWinner) {
          return pontuacao.situacao; // Acertou vencedor/empate
      }
      
      return 0; // Errou tudo
  };

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const paginatedMatches = useMemo(() => {
    return filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  }, [filteredMatches, currentPage]);

  const groupedAndPaginatedMatches = useMemo(() => {
     return paginatedMatches.reduce((acc, match) => {
        const phase = match.fase || 'Resultados Gerais';
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push(match);
        return acc;
    }, {} as Record<string, MatchWithPredictions[]>);
  }, [paginatedMatches]);

    const getPredictionStatusClass = (acertoTipo?: Prediction['acertoTipo']) => {
        switch (acertoTipo) {
            case 'combo': return 'bg-combo-gold text-black';
            case 'bonus': return 'bg-combo-silver text-black';
            case 'bucha': return 'bg-bucha-solid text-white';
            case 'situacao': return 'bg-situacao-solid text-white';
            case 'gols': return 'bg-gols-solid text-white';
            case 'erro':
            default:
                 return 'bg-erro-solid text-white';
        }
    };

    const getPointsBadgeClass = (acertoTipo?: Prediction['acertoTipo']): string => {
        switch (acertoTipo) {
            case 'combo': return 'badge-combo-gold';
            case 'bonus': return 'badge-combo-silver';
            case 'gols': return 'badge-gols-solid';
            case 'bucha': return 'badge-bucha-solid';
            case 'situacao': return 'badge-situacao-solid';
            case 'erro':
            default:
                return 'badge-erro-solid';
        }
    };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Histórico de Partidas</h1>
          <p className="text-muted-foreground">
            Consulte os resultados e os palpites de todas as partidas finalizadas.
          </p>
        </div>
      </div>
      
       <div className="flex flex-col md:flex-row gap-2 mb-8">
          <Select value={selectedChampionship} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filtrar por campeonato" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos os Campeonatos</SelectItem>
                  {championships.map(champ => (
                      <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <TooltipProvider>
        <div className="w-full space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary"/>
            </div>
          ) : Object.keys(groupedAndPaginatedMatches).length > 0 ? (
            Object.entries(groupedAndPaginatedMatches).map(([phase, matches]) => (
              <div key={phase} className="space-y-4">
                <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
                {matches.map((match) => {
                  const championship = championships.find(c => c.id === match.campeonatoId);
                  const teamA = teams.find(t => t.name === match.timeA);
                  const teamB = teams.find(t => t.name === match.timeB);

                  const finalRankingOrder = championship?.finalRanking ? Object.values(championship.finalRanking).filter(Boolean) : [];

                  return (
                    <Accordion type="single" collapsible className="w-full" key={match.id}>
                      <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                        <Card className="relative">
                          <div className="absolute top-2 right-2 z-10">
                              <AlertDialog>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreHorizontal className="h-4 w-4" />
                                              <span className="sr-only">Abrir menu de opções</span>
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                          <DropdownMenuItem onSelect={() => handleOpenEditModal(match)}>
                                              <Pencil className="mr-2 h-4 w-4" />
                                              Editar Placar
                                          </DropdownMenuItem>
                                          <AlertDialogTrigger asChild>
                                              <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                                  <Trash2 className="mr-2 h-4 w-4" />
                                                  Excluir Partida
                                              </DropdownMenuItem>
                                          </AlertDialogTrigger>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive" />Tem certeza absoluta?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              Esta ação removerá permanentemente a partida "{match.timeA} vs {match.timeB}" e todos os palpites associados. Os pontos dos usuários podem ser afetados. <strong>Esta ação não pode ser desfeita.</strong>
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(match.id, `${match.timeA} vs ${match.timeB}`)} className="bg-destructive hover:bg-destructive/90">Sim, excluir partida</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </div>
                          <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center w-full">
                              <div className="flex items-center justify-center w-full">
                                <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                  {match.timeA}
                                </div>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                  <div className='flex h-14 w-14 items-center justify-center'>
                                      <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                  </div>
                                  <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA ?? '?'}-${match.placarB ?? '?'}`}</span>
                                  <div className='flex h-14 w-14 items-center justify-center'>
                                      <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                  </div>
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
                            <div className="bg-background/80 border-t">
                              <div className="text-center py-2 text-foreground">
                                <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários</h4>
                              </div>
                              {match.predictions.length > 0 ? (
                                  <ul className="text-sm">
                                    {match.predictions.map((p, i) => {
                                      const user = users.find(u => u.id === p.userId);
                                      if (!user) return null;
                                      
                                      const champPicks = user.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                      const chosenTeams = champPicks ? champPicks.teams.map((teamName, index) => {
                                          const team = teams.find(t => t.name === teamName);
                                          const isEliminated = finalRankingOrder.length > 0 && !finalRankingOrder.includes(teamName);
                                          return team ? { ...team, pickOrder: index + 1, isEliminated } : null;
                                      }).filter((t): t is Team & { pickOrder: number; isEliminated: boolean; } => t !== null) : [];

                                      return (
                                      <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.acertoTipo))}>
                                        <div className="w-1/3 text-left flex items-center gap-2 group">
                                          <div className="relative">
                                              <Avatar className="w-8 h-8">
                                              <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                              <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                              </Avatar>
                                              <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold">{user.apelido}:</span>
                                            {chosenTeams.length > 0 && (
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
                                            )}
                                          </div>
                                        </div>
                                        <div className="w-1/3 flex justify-center font-mono font-semibold text-base relative">
                                            <div className="flex-1 text-center">
                                                <span>{p.palpiteUsuario.placarA}-{p.palpiteUsuario.placarB}</span>
                                            </div>
                                            {p.palpiteCombo && (
                                                <div className="absolute right-0 sm:left-full sm:ml-2 flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className="flex items-center gap-1">
                                                                <Goal className="h-4 w-4" />
                                                                <span>{p.palpiteCombo.totalGols}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Palpite de Gols (Combo)</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3 text-right flex items-center justify-end gap-2">
                                          {p.palpiteCombo && <Gem className={cn("h-4 w-4", p.acertoTipo === 'combo' && "animate-gem-pulse")} />}
                                          <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(p.acertoTipo))}>
                                              {p.pontos} pts
                                          </Badge>
                                        </div>
                                      </li>
                                    )})}
                                  </ul>
                              ) : (
                                  <div className="text-center p-4 text-muted-foreground">Nenhum palpite foi registrado para esta partida.</div>
                              )}
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
                      <p>Nenhum resultado encontrado para o campeonato selecionado.</p>
                  </CardContent>
              </Card>
          )}
        </div>
        </TooltipProvider>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Editar Placar Final</DialogTitle>
                {editingMatch && (
                    <DialogDescription>
                        Ajuste o resultado da partida: {editingMatch.timeA} vs {editingMatch.timeB}.
                    </DialogDescription>
                )}
            </DialogHeader>
            <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex flex-col items-center gap-2">
                    <Label htmlFor="placarA" className="text-center font-semibold">{editingMatch?.timeA}</Label>
                    <Input id="placarA" type="number" className="w-20 h-14 text-center text-2xl font-bold" value={editingScore.placarA} onChange={(e) => handleScoreChange('placarA', e.target.value)} />
                </div>
                <span className="text-2xl font-bold text-muted-foreground mt-8">-</span>
                 <div className="flex flex-col items-center gap-2">
                    <Label htmlFor="placarB" className="text-center font-semibold">{editingMatch?.timeB}</Label>
                    <Input id="placarB" type="number" className="w-20 h-14 text-center text-2xl font-bold" value={editingScore.placarB} onChange={(e) => handleScoreChange('placarB', e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSaveScore}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Placar
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


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
