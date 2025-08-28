
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { mockChampionships, mockAllMatches, Match } from '@/lib/data';
import { format, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, MoreHorizontal, Pencil, Trash2, Save, PlusCircle, ShieldAlert, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MatchForm } from '@/components/admin/match-form';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString, formatString = "eeee, dd/MM 'às' HH:mm" }: { dateString: string, formatString?: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        try {
            const date = parseISO(dateString);
            setFormattedDate(format(date, formatString, { locale: ptBR }));
        } catch (error) {
            setFormattedDate("Data inválida");
        }
    }, [dateString, formatString]);
  
    if (!formattedDate) {
        return null; 
    }
  
    return <span className='text-sm text-muted-foreground capitalize'>{formattedDate}</span>;
};

export default function AdminMatchesPage() {
    const [matches, setMatches] = useState<Match[]>(mockAllMatches);
    const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>('');
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'Agendado' | 'Ao Vivo'>('all');
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const [scores, setScores] = useState<Record<string, { placarA: string; placarB: string; }>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});

    const { toast } = useToast();

    useEffect(() => {
        const initialScores: Record<string, { placarA: string; placarB: string; }> = {};
        matches.forEach(match => {
            initialScores[match.id] = {
                placarA: match.placarA?.toString() ?? '',
                placarB: match.placarB?.toString() ?? '',
            };
        });
        setScores(initialScores);
    }, [matches]);

    const availablePhases = useMemo(() => {
        if (!selectedChampionshipId) return [];
        const phases = matches
            .filter(match => match.campeonatoId === selectedChampionshipId && (match.status === 'Agendado' || match.status === 'Ao Vivo'))
            .map(match => match.fase);
        return [...new Set(phases)];
    }, [selectedChampionshipId, matches]);
    
    const filteredMatches = useMemo(() => {
        if (!selectedChampionshipId) return [];

        return matches
            .filter(match => {
                 const isLive = isPast(parseISO(match.data));
                 const currentStatus = isLive ? 'Ao Vivo' : match.status;

                 const championshipMatch = match.campeonatoId === selectedChampionshipId;
                 const activeMatch = match.status === 'Agendado' || match.status === 'Ao Vivo';
                 const phaseMatch = selectedPhase === 'all' || match.fase === selectedPhase;
                 const statusMatch = selectedStatus === 'all' || currentStatus === selectedStatus;

                 return championshipMatch && activeMatch && phaseMatch && statusMatch;
            })
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [selectedChampionshipId, matches, selectedPhase, selectedStatus]);
    
    const groupedMatches = useMemo(() => {
        return filteredMatches.reduce((acc, match) => {
            const phase = match.fase || 'Partidas';
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(match);
            return acc;
        }, {} as Record<string, Match[]>);
    }, [filteredMatches]);


    const handleCreate = () => {
        setEditingMatch(null);
        setIsFormOpen(true);
    };

    const handleEdit = (match: Match) => {
        setEditingMatch(match);
        setIsFormOpen(true);
    };

    const handleDelete = (matchId: string) => {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        toast({
            title: "Partida Excluída",
            description: "A partida foi removida com sucesso.",
        });
    };

    const handleFormSubmit = (data: Match) => {
        if (editingMatch) {
            setMatches(prev => prev.map(m => m.id === data.id ? data : m));
            toast({
                title: "Partida Atualizada",
                description: `A partida ${data.timeA} vs ${data.timeB} foi atualizada.`,
            });
        } else {
            setMatches(prev => [...prev, data]);
            toast({
                title: "Partida Criada!",
                description: `A partida ${data.timeA} vs ${data.timeB} foi adicionada.`,
            });
        }
    };
    
    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: string) => {
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: '', placarB: '' }),
                [team]: value,
            },
        }));
    };

    const updateMatchData = (matchId: string, statusChange?: Match['status']) => {
        const currentScore = scores[matchId];
        if (!currentScore) return;

        const numScoreA = currentScore.placarA === '' ? null : Number(currentScore.placarA);
        const numScoreB = currentScore.placarB === '' ? null : Number(currentScore.placarB);
        
        setMatches(prev => prev.map(m => 
            m.id === matchId 
            ? { 
                ...m, 
                placarA: numScoreA, 
                placarB: numScoreB, 
                status: statusChange ?? (isPast(parseISO(m.data)) ? 'Ao Vivo' : 'Agendado')
              } 
            : m
        ));

        setLastUpdated(prev => ({ ...prev, [matchId]: new Date() }));
    };

    const handleScoreSave = (match: Match) => {
        updateMatchData(match.id);
        toast({
            title: "Placar Salvo!",
            description: `O placar de ${match.timeA} vs ${match.timeB} foi salvo temporariamente.`,
        });
    };

    const handleFinalizeMatch = (match: Match) => {
        updateMatchData(match.id, 'Finalizado');
        toast({
            title: "Partida Finalizada!",
            description: `A partida ${match.timeA} vs ${match.timeB} foi marcada como finalizada e movida para o histórico.`,
        });
    };


    const getStatusVariant = (status: Match['status']): "default" | "destructive" | "secondary" | "outline" => {
        switch(status) {
            case 'Ao Vivo': return 'destructive';
            case 'Agendado': return 'secondary';
            case 'Finalizado': return 'default';
            case 'Cancelado': return 'outline';
            default: return 'secondary';
        }
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <CalendarCheck className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Partidas</h1>
                        <p className="text-muted-foreground">Adicione, edite e atualize os resultados das partidas agendadas ou ao vivo.</p>
                    </div>
                </div>

                 <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                        <CardDescription>Selecione um campeonato para visualizar e filtrar suas partidas ativas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row gap-4">
                        <Select value={selectedChampionshipId} onValueChange={(value) => {
                            setSelectedChampionshipId(value);
                            setSelectedPhase('all');
                            setSelectedStatus('all');
                        }}>
                            <SelectTrigger className="w-full md:w-[250px]">
                                <SelectValue placeholder="Escolha um campeonato..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockChampionships.map(champ => (
                                    <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={!selectedChampionshipId || availablePhases.length === 0}>
                            <SelectTrigger className="w-full md:w-[250px]">
                                <SelectValue placeholder="Filtrar por fase/rodada..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Fases</SelectItem>
                                {availablePhases.map(phase => (
                                    <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)} disabled={!selectedChampionshipId}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filtrar por status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="Agendado">Agendadas</SelectItem>
                                <SelectItem value="Ao Vivo">Ao Vivo</SelectItem>
                            </SelectContent>
                        </Select>

                         {selectedChampionshipId && (
                            <div className="ml-auto flex-shrink-0">
                                <MatchForm
                                    isOpen={isFormOpen}
                                    setIsOpen={setIsFormOpen}
                                    onSubmit={handleFormSubmit}
                                    match={editingMatch}
                                    championshipId={selectedChampionshipId}
                                >
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Adicionar Partida
                                    </Button>
                                </MatchForm>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                 {selectedChampionshipId ? (
                    <div className="space-y-8">
                        {Object.keys(groupedMatches).length > 0 ? (
                           Object.entries(groupedMatches).map(([phase, matchesInPhase]) => (
                             <div key={phase} className="space-y-4">
                                <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
                                {matchesInPhase.map(match => {
                                    const score = scores[match.id] || { placarA: '', placarB: '' };
                                    const originalPlacarA = match.placarA?.toString() ?? '';
                                    const originalPlacarB = match.placarB?.toString() ?? '';
                                    const hasChanged = score.placarA !== originalPlacarA || score.placarB !== originalPlacarB;
                                    const isLive = isPast(parseISO(match.data));

                                    return (
                                        <Card key={match.id} className="relative overflow-hidden">
                                            <div className="absolute top-2 right-2 z-10">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="bg-background/50 hover:bg-muted rounded-full h-8 w-8">
                                                                <MoreHorizontal className="h-5 w-5" />
                                                                <span className="sr-only">Abrir menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(match)} disabled={isLive}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar Detalhes
                                                            </DropdownMenuItem>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Excluir Partida
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            A partida <strong>{match.timeA} vs {match.timeB}</strong> será removida permanentemente. Esta ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(match.id)}>Sim, excluir</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>

                                            <CardContent className="p-4 flex flex-col items-center justify-center gap-4">

                                                <p className="text-sm font-semibold text-muted-foreground">{match.campeonato}</p>
                                                <FormattedDate dateString={match.data} />
                                                
                                                <div className="flex items-center justify-around gap-2 w-full">
                                                    <div className='flex-1 flex flex-col items-center justify-center gap-2'>
                                                         <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Image src="https://placehold.co/128x128.png" alt={match.timeA} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{match.timeA}</p></TooltipContent>
                                                        </Tooltip>
                                                        <span className="font-bold text-lg text-center truncate w-full">{match.timeA}</span>
                                                    </div>

                                                    <div className="flex items-center justify-center gap-2">
                                                        <Input 
                                                            type="number" 
                                                            className="w-16 h-12 text-center text-2xl font-bold" 
                                                            value={score.placarA}
                                                            onChange={(e) => handleScoreChange(match.id, 'placarA', e.target.value)}
                                                            min="0"
                                                        />
                                                        <span className="font-bold text-muted-foreground text-lg">x</span>
                                                        <Input 
                                                            type="number" 
                                                            className="w-16 h-12 text-center text-2xl font-bold" 
                                                            value={score.placarB}
                                                            onChange={(e) => handleScoreChange(match.id, 'placarB', e.target.value)}
                                                            min="0"
                                                        />
                                                    </div>
                                                    
                                                    <div className='flex-1 flex flex-col items-center justify-center gap-2'>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Image src="https://placehold.co/128x128.png" alt={match.timeB} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{match.timeB}</p></TooltipContent>
                                                        </Tooltip>
                                                        <span className="font-bold text-lg text-center truncate w-full">{match.timeB}</span>
                                                    </div>
                                                </div>

                                                <Badge variant={getStatusVariant(isLive ? 'Ao Vivo' : match.status)} className={cn(isLive && 'animate-pulse')}>
                                                    {isLive ? 'Ao Vivo' : match.status}
                                                </Badge>
                                                
                                            </CardContent>
                                             <CardFooter className="flex-col items-center justify-center gap-2 px-4 pb-4">
                                                <div className="flex flex-col sm:flex-row gap-2 items-center">
                                                    <Button onClick={() => handleScoreSave(match)} disabled={!hasChanged} size="sm" variant="secondary">
                                                        <Save className="mr-2 h-4 w-4" />
                                                        Salvar Placar
                                                    </Button>
                                                    <Button onClick={() => handleFinalizeMatch(match)} disabled={score.placarA === '' || score.placarB === ''} size="sm">
                                                        <Flag className="mr-2 h-4 w-4" />
                                                        Finalizar Partida
                                                    </Button>
                                                </div>
                                                 {lastUpdated[match.id] && (
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        Alterado em {format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss")}
                                                    </p>
                                                )}
                                             </CardFooter>
                                        </Card>
                                    )
                                })}
                            </div>
                           ))
                        ) : (
                            <Card className="flex flex-col items-center justify-center p-10 border-dashed">
                                <p className="text-center text-muted-foreground">
                                    Nenhuma partida encontrada para os filtros selecionados.
                                </p>
                            </Card>
                        )}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-10 border-dashed">
                        <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-center text-muted-foreground">
                            Por favor, selecione um campeonato acima para começar.
                        </p>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    );
}

