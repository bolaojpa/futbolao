

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
import { Users, History, ChevronLeft, ChevronRight, Trophy, MoreHorizontal, Trash2, Pencil, Save, AlertTriangle, Loader2, Goal, Gem, Ghost } from 'lucide-react';
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
import { updateMatch, deleteMatch, getTeams } from '@/lib/firebase/firestore';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ITEMS_PER_PAGE = 10;

interface MatchWithPredictions extends Match {
    predictions: Prediction[];
}

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
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  
  const [selectedChampionship, setSelectedChampionship] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [editingScore, setEditingScore] = useState<{ placarA: string, placarB: string }>({ placarA: '0', placarB: '0' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const unsubChampionships = onSnapshot(collection(db, 'championships'), (snap) => {
        const championshipsData = snap.docs.map(d => ({id: d.id, ...d.data()}) as Championship);
        setChampionships(championshipsData);
        if (championshipIdFromQuery) {
            setSelectedChampionship(championshipIdFromQuery);
        } else if (championshipsData.length > 0) {
            const activeChampionship = championshipsData.find(c => c.status === 'ativo');
            setSelectedChampionship(activeChampionship ? activeChampionship.id : 'all');
        }
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => setTeams(snap.docs.map(d => ({id: d.id, ...d.data()}) as Team)));
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => setUsers(snap.docs.map(d => ({id: d.id, ...d.data()}) as UserType)));
    
    const qMatches = query(collection(db, "matches"), where('status', '==', 'Finalizado'));
    const unsubMatches = onSnapshot(qMatches, (snap) => setAllMatches(snap.docs.map(d => ({id: d.id, ...d.data()}) as Match)));

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
  
  const filteredMatches = useMemo(() => [...matchesWithPredictions]
    .filter(match => (selectedChampionship === 'all' || match.campeonatoId === selectedChampionship))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()), [selectedChampionship, matchesWithPredictions]);

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
      // A atualização dos pontos agora deve ser tratada por uma cloud function
      // para garantir a consistência dos dados.
      toast({
          title: "Placar Atualizado",
          description: `O placar de ${editingMatch.timeA} vs ${editingMatch.timeB} foi alterado. A re-pontuação será processada em segundo plano.`,
      });
      setIsEditModalOpen(false);
    } catch (error) {
        toast({ title: 'Erro ao salvar o placar', variant: 'destructive' });
    }
  };

  const handleDelete = async (matchId: string, matchName: string) => {
    try {
        await deleteMatch(matchId);
        toast({
            title: "Partida Excluída",
            description: `A partida "${matchName}" e seus palpites foram removidos.`,
            variant: "destructive",
        });
    } catch (error) {
         toast({ title: 'Erro ao excluir a partida', variant: 'destructive' });
    }
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
                  const participants = users.filter(u => championship?.participantes.includes(u.id));

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
                              {participants.length > 0 ? (
                                  <ul className="text-sm">
                                    {participants.map((user, i) => {
                                      const prediction = match.predictions.find(p => p.userId === user.id);
                                      
                                      if (!prediction) {
                                        return (
                                            <li key={user.id} className="flex justify-between items-center p-4 border-t bg-orange-500 text-white">
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
                                                    <Badge variant="secondary" className="bg-orange-700 text-white border-transparent">0 pts</Badge>
                                                </div>
                                            </li>
                                        );
                                      }

                                      return (
                                      <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(prediction.acertoTipo))}>
                                        <div className="w-1/3 text-left flex items-center gap-2 group">
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
                                                      {user.championPicks?.find(p => p.championshipId === championship.id)?.teams.map((teamName) => {
                                                          const team = teams.find(t => t.name === teamName);
                                                          if (!team) return null;
                                                          
                                                          return (
                                                              <Tooltip key={team.id}>
                                                                  <TooltipTrigger>
                                                                      <Image src={team.crestUrl} alt={team.name} width={16} height={16} className="object-contain" />
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
                                        <div className="w-1/3 flex justify-center font-mono font-semibold text-base relative">
                                            <div className="flex-1 text-center">
                                                <span>{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                            </div>
                                            {prediction.palpiteCombo && (
                                                <div className="absolute right-0 sm:left-full sm:ml-2 flex items-center gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <div className="flex items-center gap-1">
                                                                <Goal className="h-4 w-4" />
                                                                <span>{prediction.palpiteCombo.totalGols}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Palpite de Gols (Combo)</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )}
                                        </div>
                                        <div className="w-1/3 text-right flex items-center justify-end gap-2">
                                          {prediction.palpiteCombo && <Gem className={cn("h-4 w-4", prediction.acertoTipo === 'combo' && "animate-gem-pulse")} />}
                                          <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(prediction.acertoTipo))}>
                                              {prediction.pontos} pts
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
