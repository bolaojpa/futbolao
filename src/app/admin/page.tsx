

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import type { Match, Prediction, UserType, Championship, Team } from '@/lib/types';
import { getMatches, updateMatch, getUsers, getChampionships, getTeams, getPredictionsForMatch, addToastNotification, updateUserStatsAfterMatch, getSystemSettings } from '@/lib/firebase/firestore';
import { format, parseISO, isPast } from 'date-fns';
import { Flag, LayoutDashboard, Save, Swords, Zap, Users, Eye, ChevronDown, Trophy, Gem, Goal, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generatePerformanceUpdate } from '@/ai/flows/generate-performance-update';
import { doc, updateDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface MatchWithPredictions extends Match {
    predictions: Prediction[];
}


export default function AdminDashboardPage() {
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [liveMatchesWithPredictions, setLiveMatchesWithPredictions] = useState<MatchWithPredictions[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [allChampionships, setAllChampionships] = useState<Championship[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [scores, setScores] = useState<Record<string, { placarA: string; placarB: string; }>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    const { toast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        const fetchInitialData = async () => {
            try {
                const [usersData, championshipsData, teamsData] = await Promise.all([
                    getUsers(),
                    getChampionships(),
                    getTeams(),
                ]);
                setAllUsers(usersData);
                setAllChampionships(championshipsData);
                setAllTeams(teamsData);
            } catch (error) {
                toast({ title: 'Erro ao carregar dados iniciais', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();

        const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setAllMatches(matchesData);
        });

        const unsubPredictions = onSnapshot(collection(db, "predictions"), (snapshot) => {
            const predictionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
            setAllPredictions(predictionsData);
        });

        return () => {
            unsubMatches();
            unsubPredictions();
        };
    }, [toast]);
    

    useEffect(() => {
        const updateLiveMatches = async () => {
            const live = allMatches.filter(match => 
                match.status !== 'Finalizado' && 
                match.status !== 'Cancelado' &&
                isPast(parseISO(match.data))
            ).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

            const matchesWithPredictions: MatchWithPredictions[] = live.map(match => ({
                ...match,
                predictions: allPredictions.filter(p => p.matchId === match.id)
            }));
            
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

        if (allMatches.length > 0) {
            updateLiveMatches();
        }
    }, [allMatches, allPredictions]);
    

    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: '0', placarB: '0' }),
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

     const calculatePointsForSingleMatch = (match: Match, prediction: Prediction): { pontos: number, acertoTipo: Prediction['acertoTipo'] } => {
        const { placarA: finalA, placarB: finalB } = match;
        const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
        
        const championship = allChampionships.find(c => c.id === match.campeonatoId);
        const pontuacao = championship?.pontuacao;

        if (finalA === undefined || finalA === null || finalB === undefined || finalB === null || !pontuacao) {
            return { pontos: 0, acertoTipo: 'erro' };
        }

        const acertouPlacarExato = guessA === finalA && guessB === finalB;
        const finalWinner = finalA > finalB ? 'A' : finalA < finalB ? 'B' : 'E';
        const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
        const acertouSituacao = finalWinner === guessWinner;
        
        let pontosGanhos = 0;
        let acertoTipo: Prediction['acertoTipo'] = 'erro';
        
        const usouCombo = !!prediction.palpiteCombo;
        const totalGolsFinal = finalA + finalB;
        const acertouGols = usouCombo && prediction.palpiteCombo?.totalGols === totalGolsFinal;

        if (acertouPlacarExato) {
            pontosGanhos = pontuacao.tradicional.exato;
            acertoTipo = 'bucha';
            if (acertouGols && pontuacao.combo.ativo) {
                pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
                acertoTipo = 'combo';
            }
        } else if (acertouSituacao) {
            pontosGanhos = pontuacao.tradicional.situacao;
            acertoTipo = 'situacao';
             if (acertouGols && pontuacao.combo.ativo) {
                pontosGanhos += pontuacao.combo.pontosGols;
                acertoTipo = 'bonus';
            }
        } else if (acertouGols && pontuacao.combo.ativo) {
            pontosGanhos = pontuacao.combo.pontosGols;
            acertoTipo = 'gols';
        }
        
        return { pontos: pontosGanhos, acertoTipo };
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
             // 0. Captura o estado do ranking ANTES da atualização
            const usersBeforeUpdate = [...allUsers];

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
                     await updateUserStatsAfterMatch(user.id, championship.id, result.pontos, result.acertoTipo, prediction.id!);
                }
            }

            // 3. Busca os usuários atualizados para refletir no ranking e enviar notificações
            const usersAfterUpdate = await getUsers();
            setAllUsers(usersAfterUpdate);

             // 4. (Opcional) Envia notificação por IA
            const systemSettings = await getSystemSettings();
            const enableAiNotifications = systemSettings.enablePerformanceNotifications ?? true;
            
            if (enableAiNotifications && championship.predictionAssist?.active) {
                for (const prediction of match.predictions) {
                    const userBefore = usersBeforeUpdate.find(u => u.id === prediction.userId);
                    const userAfter = usersAfterUpdate.find(u => u.id === prediction.userId);

                    if (userBefore && userAfter) {
                        const pontosGanhos = calculatePointsForSingleMatch(finalizedMatch, prediction).pontos;
                        
                        const getPosition = (userList: UserType[], userId: string, champId: string) => {
                             const sorted = userList.sort((a,b) => (b.championshipStats?.find(s => s.championshipId === champId)?.pontos ?? 0) - (a.championshipStats?.find(s => s.championshipId === champId)?.pontos ?? 0))
                             return sorted.findIndex(u => u.id === userId) + 1;
                        }

                        const oldPosition = getPosition(usersBeforeUpdate, userBefore.id, championship.id);
                        const newPosition = getPosition(usersAfterUpdate, userAfter.id, championship.id);

                        const notificationData = {
                            apelido: userAfter.apelido,
                            pontosGanhos: pontosGanhos,
                            posicaoAnterior: oldPosition > 0 ? oldPosition : usersBeforeUpdate.length,
                            novaPosicao: newPosition > 0 ? newPosition : usersAfterUpdate.length,
                            nomePartida: `${match.timeA} vs ${match.timeB}`
                        };

                        generatePerformanceUpdate(notificationData).then(result => {
                            addToastNotification(userAfter.id, result.titulo, result.mensagem);
                        }).catch(err => {
                            console.error("Falha ao gerar notificação de IA para", userAfter.apelido, err);
                        });
                    }
                }
            }


        } catch (error) {
             console.error("Erro ao finalizar partida: ", error);
             toast({ title: 'Erro ao finalizar a partida', variant: 'destructive', description: "Verifique o console para mais detalhes." });
        }
    };
    
    const getPredictionStatusClass = (acertoTipo?: Prediction['acertoTipo']) => {
        switch (acertoTipo) {
            case 'combo': return 'bg-combo-gold text-black';
            case 'bonus': return 'bg-combo-silver text-black';
            case 'bucha': return 'bg-bucha-solid';
            case 'situacao': return 'bg-situacao-solid';
            case 'gols': return 'bg-gols-solid';
            case 'erro':
            default:
                 return 'bg-erro-solid';
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

     const getChampionPickWinner = useMemo(() => {
        const cache: Record<string, { winnerId: string[]; winningTeam: string; tier: { rank: number; pick: number } } | null> = {};

        return (championship: Championship) => {
            if (cache[championship.id]) return cache[championship.id];
            
            const finalRankingOrder = championship.finalRanking ? Object.values(championship.finalRanking).filter(Boolean) as string[] : [];
            if (finalRankingOrder.length === 0) {
                cache[championship.id] = null;
                return null;
            }

            let bestTier: { rank: number; pick: number } | null = null;
            let tierContenders: UserType[] = [];

            for (let rankIndex = 0; rankIndex < finalRankingOrder.length; rankIndex++) {
                const rankedTeam = finalRankingOrder[rankIndex];
                for (let pickIndex = 0; pickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); pickIndex++) {
                    const contenders = allUsers.filter(u => u.championPicks?.some(p => p.championshipId === championship.id && p.teams[pickIndex] === rankedTeam));
                    if (contenders.length > 0) {
                        bestTier = { rank: rankIndex, pick: pickIndex };
                        tierContenders = contenders;
                        break;
                    }
                }
                if (bestTier) break;
            }

            if (!bestTier || tierContenders.length === 0) {
                cache[championship.id] = null;
                return null;
            }
            
            // CRITÉRIO DE DESEMPATE
            let finalWinners = [...tierContenders];

            // 1. Desempate por palpites subsequentes
            for (let nextPickIndex = bestTier.pick + 1; nextPickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); nextPickIndex++) {
                if (finalWinners.length === 1) break;

                const nextPickWinners: { user: UserType, rank: number }[] = [];
                for (const user of finalWinners) {
                    const userPick = user.championPicks?.find(p => p.championshipId === championship.id)?.teams[nextPickIndex];
                    if (userPick) {
                        const rank = finalRankingOrder.indexOf(userPick);
                        if (rank !== -1) {
                            nextPickWinners.push({ user, rank });
                        }
                    }
                }

                if (nextPickWinners.length > 0) {
                    const bestRank = Math.min(...nextPickWinners.map(w => w.rank));
                    const newTiedUsers = nextPickWinners.filter(w => w.rank === bestRank).map(w => w.user);
                    if (newTiedUsers.length < finalWinners.length) {
                        finalWinners = newTiedUsers;
                    }
                }
            }

            // 2. Desempate pelo jogo final
            if (finalWinners.length > 1) {
                const finalMatch = allMatches
                    .filter(m => m.campeonatoId === championship.id && m.fase.toLowerCase().includes('final'))
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                if (finalMatch) {
                    const buchaWinners = finalWinners.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'bucha' || p.acertoTipo === 'combo')));
                    if (buchaWinners.length > 0 && buchaWinners.length < finalWinners.length) {
                        finalWinners = buchaWinners;
                    } else {
                        const situationWinners = finalWinners.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'situacao' || p.acertoTipo === 'bonus')));
                        if (situationWinners.length > 0 && situationWinners.length < finalWinners.length) {
                           finalWinners = situationWinners;
                        }
                    }
                }
            }
            
            const winningTeam = finalRankingOrder[bestTier.rank];
            const winnerIds = finalWinners.map(u => u.id);

            cache[championship.id] = { winnerId: winnerIds, winningTeam, tier: bestTier };
            return cache[championship.id];
        }
    }, [allUsers, allMatches, allPredictions]);

    const calculateSimulatedPoints = (match: Match, prediction: Prediction): { pontos: number, acertoTipo: Prediction['acertoTipo'] } => {
        const liveScore = scores[match.id];
        if (!liveScore || liveScore.placarA === '' || liveScore.placarB === '') return { pontos: 0, acertoTipo: 'erro' };
        
        const livePlacarA = Number(liveScore.placarA);
        const livePlacarB = Number(liveScore.placarB);
        
        const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
        
        const championship = allChampionships.find(c => c.id === match.campeonatoId);
        const pontuacao = championship?.pontuacao;
        if (!pontuacao) return { pontos: 0, acertoTipo: 'erro' };
        
        const acertouPlacarExato = guessA === livePlacarA && guessB === livePlacarB;
        const finalWinner = livePlacarA > livePlacarB ? 'A' : livePlacarA < livePlacarB ? 'B' : 'E';
        const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
        const acertouSituacao = finalWinner === guessWinner;
        
        let pontosGanhos = 0;
        let acertoTipo: Prediction['acertoTipo'] = 'erro';
        
        const usouCombo = !!prediction.palpiteCombo;
        const totalGolsFinal = livePlacarA + livePlacarB;
        const acertouGols = usouCombo && prediction.palpiteCombo?.totalGols === totalGolsFinal;

        if (acertouPlacarExato) {
            pontosGanhos = pontuacao.tradicional.exato;
            acertoTipo = 'bucha';
            if (acertouGols && pontuacao.combo.ativo) {
                pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
                acertoTipo = 'combo';
            }
        } else if (acertouSituacao) {
            pontosGanhos = pontuacao.tradicional.situacao;
            acertoTipo = 'situacao';
             if (acertouGols && pontuacao.combo.ativo) {
                pontosGanhos += pontuacao.combo.pontosGols;
                acertoTipo = 'bonus';
            }
        } else if (acertouGols && pontuacao.combo.ativo) {
            pontosGanhos = pontuacao.combo.pontosGols;
            acertoTipo = 'gols';
        }
        
        return { pontos: pontosGanhos, acertoTipo };
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
                                                    <div className="flex flex-col items-center justify-center w-full">
                                                        <div className="flex justify-center items-center gap-2 text-center">
                                                            {championship?.iconUrl && <Image src={championship.iconUrl} alt="" width={20} height={20} />}
                                                            <p className="text-sm font-semibold text-muted-foreground">{match.campeonato}</p>
                                                        </div>
                                                        <div className="flex items-center justify-center w-full mt-4">
                                                            <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                                <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                                <div className='flex h-14 w-14 items-center justify-center'>
                                                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
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
                                                                <div className='flex h-14 w-14 items-center justify-center'>
                                                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                                <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-4 mt-4">
                                                             <Badge variant='destructive' className='animate-pulse'>Ao Vivo</Badge>
                                                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                                                <Button onClick={() => handleScoreSave(match.id)} size="sm" variant="secondary">
                                                                    <Save className="h-4 w-4 md:mr-2" />
                                                                    <span className="hidden md:inline">Salvar Placar</span>
                                                                </Button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                         <Button disabled={score.placarA === '' || score.placarB === ''} size="sm">
                                                                            <Flag className="h-4 w-4 md:mr-2" />
                                                                            <span className="hidden md:inline">Finalizar Partida</span>
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-destructive"/>Finalizar esta partida?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                Esta ação é irreversível. A partida será movida para o histórico, e os pontos dos usuários serão consolidados permanentemente.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                            <AlertDialogAction onClick={() => handleFinalizeMatch(match)}>Sim, finalizar</AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
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
                                                     <div className="text-center py-2 text-foreground">
                                                        <h4 className="font-semibold flex items-center justify-center gap-2 py-1">
                                                            <Users className="w-4 h-4" /> Palpites dos Usuários
                                                        </h4>
                                                    </div>
                                                    <ul className="text-sm max-h-[40vh] overflow-y-auto">
                                                    {match.predictions.map((p, i) => {
                                                        const user = allUsers.find(u => u.id === p.userId);
                                                        if (!user) return null;
                                                        
                                                        const { pontos: simulatedPoints, acertoTipo: simulatedAcertoTipo } = calculateSimulatedPoints(match, p);
                                                        
                                                        return (
                                                        <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(simulatedAcertoTipo))}>
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
                                                                     {championship?.championPredictionSettings?.active && (
                                                                         <>
                                                                            <div className="relative block sm:hidden">
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
                                                                            </div>
                                                                            <div className='hidden sm:flex items-center gap-1'>
                                                                                {user.championPicks?.find(pick => pick.championshipId === championship.id)?.teams.map(teamName => {
                                                                                    const team = allTeams.find(t => t.name === teamName);
                                                                                    if (!team) return null;
                                                                                     const winnerInfo = getChampionPickWinner(championship);
                                                                                     const isEliminated = !!winnerInfo && !winnerInfo.winnerId.includes(user.id);
                                                                                    return (
                                                                                        <Tooltip key={team.id}>
                                                                                            <TooltipTrigger>
                                                                                                <Image src={team.crestUrl} alt={team.name} width={16} height={16} className={cn("object-contain", isEliminated && "opacity-30")} />
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent><p>{team.name}</p></TooltipContent>
                                                                                        </Tooltip>
                                                                                    );
                                                                                })}
                                                                            </div>
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
                                                                {p.palpiteCombo && <Gem className={cn("h-4 w-4", simulatedAcertoTipo === 'combo' ? "animate-gem-pulse" : "" )} />}
                                                                <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(simulatedAcertoTipo))}>
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
}

