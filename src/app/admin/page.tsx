

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Match, Prediction, UserType, Championship, Team } from '@/lib/types';
import { getMatches, updateMatch, getUsers, getChampionships, getTeams, getPredictionsForMatch, addNotification, updateUserStatsAfterMatch } from '@/lib/firebase/firestore';
import { format, parseISO, isPast } from 'date-fns';
import { Flag, LayoutDashboard, Save, Swords, Zap, Users, Eye, ChevronDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generatePerformanceUpdate } from '@/ai/flows/generate-performance-update';
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MatchWithPredictions extends Match {
    predictions: Prediction[];
}


export default function AdminDashboardPage() {
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [liveMatchesWithPredictions, setLiveMatchesWithPredictions] = useState<MatchWithPredictions[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [allChampionships, setAllChampionships] = useState<Championship[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [scores, setScores] = useState<Record<string, { placarA: string; placarB: string; }>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [isLoading, setIsLoading] = useState(true);
    // Simula a busca da configuração do admin
    const [enableAiNotifications, setEnableAiNotifications] = useState(true);

    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [matchesData, usersData, championshipsData, teamsData] = await Promise.all([
                getMatches(),
                getUsers(),
                getChampionships(),
                getTeams(),
            ]);

            setAllMatches(matchesData);
            setAllUsers(usersData);
            setAllChampionships(championshipsData);
            setAllTeams(teamsData);

        } catch (error) {
            toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const updateLiveMatches = async () => {
            const live = allMatches.filter(match => 
                match.status !== 'Finalizado' && 
                match.status !== 'Cancelado' &&
                isPast(parseISO(match.data))
            ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

            const matchesWithPredictions: MatchWithPredictions[] = await Promise.all(
                live.map(async (match) => {
                    const predictions = await getPredictionsForMatch(match.id);
                    return { ...match, predictions };
                })
            );
            
            setLiveMatchesWithPredictions(matchesWithPredictions);

            // Initialize scores for live matches
            const initialScores = live.reduce((acc, match) => {
                acc[match.id] = { 
                    placarA: match.placarA?.toString() ?? '0', 
                    placarB: match.placarB?.toString() ?? '0' 
                };
                return acc;
            }, {} as Record<string, { placarA: string; placarB: string; }>);
            setScores(prevScores => ({ ...initialScores, ...prevScores }));
        };

        updateLiveMatches();
        const interval = setInterval(updateLiveMatches, 30000); 

        return () => clearInterval(interval);
    }, [allMatches]);
    

    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: '', placarB: '' }),
                [team]: numericValue,
            },
        }));
    };

    const handleScoreSave = async (matchId: string) => {
        const currentScore = scores[matchId];
        if (!currentScore) return;

        const numScoreA = currentScore.placarA === '' ? null : Number(currentScore.placarA);
        const numScoreB = currentScore.placarB === '' ? null : Number(currentScore.placarB);

        try {
            await updateMatch(matchId, {
                placarA: numScoreA, 
                placarB: numScoreB, 
                status: 'Ao Vivo'
            });
            setLastUpdated(prev => ({ ...prev, [matchId]: new Date() }));
            toast({
                title: "Placar Salvo!",
                description: `O placar da partida foi salvo temporariamente.`,
            });
        } catch (error) {
            toast({ title: 'Erro ao salvar o placar', variant: 'destructive' });
        }
    };

    const calculatePointsForSingleMatch = (match: Match, prediction: Prediction): { pontos: number, exato: boolean, situacao: boolean } => {
        const { placarA: finalA, placarB: finalB } = match;
        const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
        const championship = allChampionships.find(c => c.id === match.campeonatoId);
        const pontuacao = championship?.pontuacao.tradicional;
    
        if (finalA === undefined || finalA === null || finalB === undefined || finalB === null || !pontuacao) {
            return { pontos: 0, exato: false, situacao: false };
        }
    
        const acertouPlacarExato = guessA === finalA && guessB === finalB;
        if (acertouPlacarExato) {
            return { pontos: pontuacao.exato, exato: true, situacao: false }; // Situação é falsa se o placar for exato
        }
    
        const finalWinner = finalA > finalB ? 'A' : finalA < finalB ? 'B' : 'E';
        const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
    
        if (finalWinner === guessWinner) {
            return { pontos: pontuacao.situacao, exato: false, situacao: true };
        }
    
        return { pontos: 0, exato: false, situacao: false };
    };


    const handleFinalizeMatch = async (match: MatchWithPredictions) => {
       const currentScore = scores[match.id];
        if (currentScore.placarA === '' || currentScore.placarB === '') {
            toast({ title: "Placar inválido", description: "O placar não pode estar em branco.", variant: "destructive"});
            return;
        };

        const finalScoreA = Number(currentScore.placarA);
        const finalScoreB = Number(currentScore.placarB);
        const finalizedMatch = { ...match, status: 'Finalizado', placarA: finalScoreA, placarB: finalScoreB } as const;

        try {
            // 1. Atualiza o status da partida para Finalizado
            await updateMatch(match.id, { 
                status: 'Finalizado',
                placarA: finalScoreA,
                placarB: finalScoreB
            });
            
            // Refresca a lista de partidas localmente para UI
            const updatedMatches = await getMatches();
            setAllMatches(updatedMatches);

            toast({
                title: "Partida Finalizada!",
                description: `A partida ${match.timeA} vs ${match.timeB} foi movida para o histórico. Consolidando pontos...`,
            });
            
            const championship = allChampionships.find(c => c.id === match.campeonatoId);
            if (!championship) {
                throw new Error("Campeonato não encontrado para a partida.");
            }
            
            // 2. Itera sobre cada palpite da partida finalizada para atualizar os stats de cada usuário
            for (const prediction of match.predictions) {
                const user = allUsers.find(u => u.id === prediction.userId);
                if (user) {
                     const result = calculatePointsForSingleMatch(finalizedMatch, prediction);
                     await updateUserStatsAfterMatch(user.id, championship.id, result.pontos, result.exato, result.situacao, prediction.id!);

                    // 3. (Opcional) Envia notificação por IA
                    if (enableAiNotifications) {
                        const { pontos } = calculatePointsForSingleMatch(finalizedMatch, prediction);
                        const oldPosition = allUsers.findIndex(u => u.id === user.id) + 1;
                        const newPosition = pontos > 5 ? oldPosition - 1 : oldPosition;
                        
                        const notificationData = {
                            apelido: user.apelido,
                            pontosGanhos: pontos,
                            posicaoAnterior: oldPosition,
                            novaPosicao: newPosition > 0 ? newPosition : 1,
                            nomePartida: `${match.timeA} vs ${match.timeB}`
                        };

                        generatePerformanceUpdate(notificationData).then(result => {
                            addNotification(user.id, result.titulo, result.mensagem, '/dashboard/leaderboard');
                        }).catch(err => {
                            console.error("Falha ao gerar notificação de IA para", user.apelido, err);
                        });
                    }
                }
            }

            // 4. Busca os usuários atualizados para refletir no ranking
            const updatedUsers = await getUsers();
            setAllUsers(updatedUsers);

        } catch (error) {
             console.error("Erro ao finalizar partida: ", error);
             toast({ title: 'Erro ao finalizar a partida', variant: 'destructive', description: "Verifique o console para mais detalhes." });
        }
    };
    
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

    const calculateSimulatedPoints = (match: Match, palpitePlacarA: number, palpitePlacarB: number): number => {
        const liveScore = scores[match.id];
        if (!liveScore || liveScore.placarA === '' || liveScore.placarB === '') return 0;
        
        const livePlacarA = Number(liveScore.placarA);
        const livePlacarB = Number(liveScore.placarB);
        
        const championship = allChampionships.find(c => c.id === match.campeonatoId);
        const pontuacao = championship?.pontuacao.tradicional;
        if (!pontuacao) return 0;
        
        const acertouPlacar = palpitePlacarA === livePlacarA && palpitePlacarB === livePlacarB;
        if (acertouPlacar) return pontuacao.exato;

        const liveVencedor = livePlacarA > livePlacarB ? 'A' : livePlacarA < livePlacarB ? 'B' : 'E';
        const palpiteVencedor = palpitePlacarA > palpitePlacarB ? 'A' : palpitePlacarA < palpitePlacarB ? 'B' : 'E';

        if (liveVencedor === palpiteVencedor) {
            return pontuacao.situacao;
        }

        return 0;
    };


    return (
        <TooltipProvider>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Dashboard do Administrador</h1>
                        <p className="text-muted-foreground">Gerencie partidas ao vivo e acompanhe o andamento.</p>
                    </div>
                </div>

                <section>
                    <div className="flex items-center gap-2 mb-4">
                         <Zap className="w-6 h-6 text-destructive animate-pulse" />
                        <h2 className="text-2xl font-bold font-headline">Acontecendo Agora ({liveMatchesWithPredictions.length})</h2>
                    </div>
                    {isLoading ? (
                         <div className="space-y-4">
                            <div className="h-40 w-full bg-muted rounded-lg animate-pulse" />
                            <div className="h-40 w-full bg-muted rounded-lg animate-pulse" />
                         </div>
                    ) : liveMatchesWithPredictions.length > 0 ? (
                        <div className="space-y-4">
                            {liveMatchesWithPredictions.map(match => {
                                const score = scores[match.id] || { placarA: '0', placarB: '0' };
                                const championship = allChampionships.find(c => c.id === match.campeonatoId);
                                const teamA = allTeams.find(t => t.name === match.timeA);
                                const teamB = allTeams.find(t => t.name === match.timeB);

                                return (
                                <Accordion type="single" collapsible className="w-full" key={match.id}>
                                    <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                                        <Card className="relative overflow-hidden border-destructive/50">
                                             <div className="p-4">
                                                 <div className="flex flex-col items-center justify-center w-full gap-4">
                                                    <div className="flex justify-center items-center gap-2 text-center">
                                                        {championship?.iconUrl && <Image src={championship.iconUrl} alt="" width={20} height={20} />}
                                                        <p className="text-sm font-semibold text-muted-foreground">{match.campeonato}</p>
                                                    </div>
                                                    <div className="flex items-center justify-around w-full">
                                                        <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                            <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                            <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                                        </div>
                                                        <div className="flex items-center justify-center gap-2 mx-2">
                                                            <Input 
                                                                type="number" 
                                                                className="w-16 h-12 text-center text-2xl font-bold" 
                                                                value={score.placarA}
                                                                onChange={(e) => handleScoreChange(match.id, 'placarA', e.target.value)}
                                                                min="0"
                                                            />
                                                            <span className='text-2xl font-bold text-muted-foreground'>-</span>
                                                            <Input 
                                                                type="number" 
                                                                className="w-16 h-12 text-center text-2xl font-bold" 
                                                                value={score.placarB}
                                                                onChange={(e) => handleScoreChange(match.id, 'placarB', e.target.value)}
                                                                min="0"
                                                            />
                                                        </div>
                                                        <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                            <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                                            <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-4">
                                                         <Badge variant='destructive' className='animate-pulse'>Ao Vivo</Badge>
                                                        <div className="flex flex-row gap-2 items-center">
                                                            <Button onClick={() => handleScoreSave(match.id)} size="sm" variant="secondary">
                                                                <Save className="h-4 w-4 md:mr-2" />
                                                                <span className="hidden md:inline">Salvar Placar</span>
                                                            </Button>
                                                            <Button onClick={() => handleFinalizeMatch(match)} disabled={score.placarA === '' || score.placarB === ''} size="sm">
                                                                <Flag className="h-4 w-4 md:mr-2" />
                                                                <span className="hidden md:inline">Finalizar Partida</span>
                                                            </Button>
                                                        </div>
                                                        {lastUpdated[match.id] && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Alterado em {format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss")}
                                                            </p>
                                                        )}
                                                    </div>
                                                 </div>
                                            </div>
                                             <AccordionTrigger className="w-full p-2 border-t hover:bg-muted/50">
                                                <ChevronDown className="h-4 w-4 mx-auto" />
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                 <div className="bg-background/80 border-t">
                                                    <div className="text-center py-2">
                                                    <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários</h4>
                                                    </div>
                                                    <ul className="text-sm max-h-[40vh] overflow-y-auto">
                                                    {match.predictions.map((p, i) => {
                                                        const user = allUsers.find(u => u.id === p.userId);
                                                        if (!user) return null;
                                                        
                                                        const simulatedPoints = calculateSimulatedPoints(match, p.palpiteUsuario.placarA, p.palpiteUsuario.placarB);
                                                        const champPicks = user.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                        const chosenTeams = champPicks ? allTeams.filter(t => champPicks.teams.includes(t.name)) : [];
                                                        const pontuacao = allChampionships.find(c => c.id === match.campeonatoId)?.pontuacao.tradicional;
                                                        const maxPontos = pontuacao?.exato ?? 0;

                                                        return (
                                                        <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(simulatedPoints, maxPontos))}>
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
                                                                                             <Image src={team.crestUrl} alt={team.name} width={16} height={16} className="rounded-full" />
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent><p>{team.name}</p></TooltipContent>
                                                                                    </Tooltip>
                                                                                ))}
                                                                            </div>
                                                                            <div className="flex sm:hidden">
                                                                                <Tooltip>
                                                                                    <TooltipTrigger>
                                                                                        <Trophy className="h-4 w-4 text-amber-500" />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p className='font-semibold'>Palpites de Campeão:</p>
                                                                                        <ul className='list-disc list-inside'>
                                                                                            {chosenTeams.map(team => <li key={team.id}>{team.name}</li>)}
                                                                                        </ul>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpiteUsuario.placarA}-{p.palpiteUsuario.placarB}</span>
                                                            <div className="w-1/3 text-right">
                                                                <Badge variant={getPointsBadgeVariant(simulatedPoints, maxPontos)} className='whitespace-nowrap'>
                                                                {simulatedPoints} pts
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
                                )
                            })}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Nenhuma partida ao vivo no momento.</p>
                            </CardContent>
                        </Card>
                    )}
                </section>
            </div>
        </TooltipProvider>
    );

    
