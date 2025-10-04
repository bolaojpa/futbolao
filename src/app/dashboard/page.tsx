

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { format, parseISO, isToday, differenceInHours, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, History, Zap, AlarmClock, Medal, Trophy, AlertCircle, Goal, LayoutDashboard, ChevronDown, HelpCircle, Gem, Swords, Ghost } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Countdown } from '@/components/shared/countdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Honorifics } from '@/components/shared/honorifics';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import type { Match, Prediction, UserType, Championship, Team } from '@/lib/types';
import { getChampionships, getTeams } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const UpcomingMatchDate = ({ matchDateString }: { matchDateString: string }) => {
    const matchDate = parseISO(matchDateString);
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
    
    if (isToday(matchDate)) {
      return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{`Hoje às ${format(matchDate, "HH:mm", { locale: ptBR })}`}</div>;
    }

    return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{format(matchDate, "eeee, dd/MM 'às' HH:mm", { locale: ptBR })}</div>;
};

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [allChampionships, setAllChampionships] = useState<Championship[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const matchRefs = useRef<Record<string, HTMLElement | null>>({});
    
     useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); 
      return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            const fetchInitialData = async () => {
                setLoadingData(true);
                try {
                    const [championshipsData, teamsData] = await Promise.all([
                        getChampionships(),
                        getTeams(),
                    ]);
                    setAllChampionships(championshipsData);
                    setAllTeams(teamsData);
                } catch (error) {
                    console.error("Failed to fetch initial dashboard data:", error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchInitialData();
            
            // Set up real-time listeners
            const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
                const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
                setAllMatches(matchesData);
            });
            const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
                setAllUsers(usersData);
            });
            const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
                const predictionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
                setAllPredictions(predictionsData);
            });

            return () => {
                unsubMatches();
                unsubUsers();
                unsubPredictions();
            };
        }
    }, [user, authLoading]);

    // Scroll to match if hash is present
    useEffect(() => {
        if (window.location.hash) {
            const matchId = window.location.hash.substring(1);
            setTimeout(() => {
                const element = matchRefs.current[matchId];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, [loadingData]);

    const userChampionships = useMemo(() => {
        if (!user) return [];
        return allChampionships.filter(c => c.participantes.includes(user.id));
    }, [allChampionships, user]);

    const upcomingMatches = useMemo(() => {
        if (userChampionships.length === 0) return [];
        const userChampionshipIds = userChampionships.map(c => c.id);
        return allMatches
            .filter(match => userChampionshipIds.includes(match.campeonatoId) && (match.status === 'Agendado' && !isPast(parseISO(match.data))))
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 5); // Limita a 5 jogos
    }, [allMatches, userChampionships, currentTime]);

    const liveMatches = useMemo(() => {
        if (userChampionships.length === 0) return [];
        const userChampionshipIds = userChampionships.map(c => c.id);
        return allMatches
            .filter(match => userChampionshipIds.includes(match.campeonatoId) && (match.status === 'Ao Vivo' || (match.status === 'Agendado' && isPast(parseISO(match.data)))))
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [allMatches, userChampionships, currentTime]);

    const recentMatches = useMemo(() => {
        return allMatches
            .filter(match => match.status === 'Finalizado')
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 3);
    }, [allMatches]);

    const userPredictions = useMemo(() => allPredictions.filter(p => p.userId === user?.id), [allPredictions, user]);

    const calculateLivePoints = (match: Match, prediction: Prediction): { pontos: number; acertoTipo: Prediction['acertoTipo'] } => {
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
            if (acertouGols && pontuacao.combo) {
                pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
                acertoTipo = 'combo';
            }
        } else if (acertouSituacao) {
            pontosGanhos = pontuacao.tradicional.situacao;
            acertoTipo = 'situacao';
             if (acertouGols && pontuacao.combo) {
                pontosGanhos += pontuacao.combo.pontosGols;
                acertoTipo = 'bonus';
            }
        } else if (acertouGols && pontuacao.combo) {
            pontosGanhos = pontuacao.combo.pontosGols;
            acertoTipo = 'gols';
        }
        
        return { pontos: pontosGanhos, acertoTipo };
    };
    
    const leaderboards = useMemo(() => {
        if (!user || allUsers.length === 0 || userChampionships.length === 0) return [];
    
        return userChampionships
            .filter(championship => championship.status === 'ativo')
            .map(championship => {
            const hasStarted = allMatches.some(m => m.campeonatoId === championship.id && (m.status === 'Ao Vivo' || m.status === 'Finalizado'));
            if (!hasStarted) return null;

            const usersInChamp = allUsers.filter(u => championship.participantes.includes(u.id));

            const usersWithLivePoints = usersInChamp.map(u => {
                const baseStats = u.championshipStats?.find(s => s.championshipId === championship.id);
                let basePoints = baseStats?.pontos ?? 0;
                let baseExatos = baseStats?.acertosExatos ?? 0;
                let baseSituacoes = baseStats?.acertosSituacao ?? 0;
                
                liveMatches.forEach(match => {
                    if (match.campeonatoId === championship.id) {
                        const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === u.id);
                        if (prediction) {
                             const result = calculateLivePoints(match, prediction);
                            basePoints += result.pontos;
                            if (result.acertoTipo === 'bucha' || result.acertoTipo === 'combo') baseExatos++;
                            if (result.acertoTipo === 'situacao' || result.acertoTipo === 'bonus') baseSituacoes++;
                        }
                    }
                });
                return { ...u, pontos: basePoints, exatos: baseExatos, situacoes: baseSituacoes };
            });

            const tiebreakerRules = championship.regrasDesempate || [];
            const championshipMatches = allMatches.filter(m => m.campeonatoId === championship.id).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());

            const sortedUsers = [...usersWithLivePoints].sort((a, b) => {
                if (a.pontos !== b.pontos) return b.pontos - a.pontos;

                for (const rule of tiebreakerRules) {
                    switch (rule) {
                        case 'maiorNumeroExatos':
                            if (a.exatos !== b.exatos) return b.exatos - a.exatos;
                            break;
                        case 'maiorNumeroSituacoes':
                            if (a.situacoes !== b.situacoes) return b.situacoes - a.situacoes;
                            break;
                        case 'primeiraBucha':
                            if (championship.pontuacao.tradicional) {
                                const maxPontos = championship.pontuacao.tradicional.exato;
                                const buchasA = allPredictions.filter(p => p.userId === a.id && p.pontos === maxPontos).map(p => p.matchId);
                                const buchasB = allPredictions.filter(p => p.userId === b.id && p.pontos === maxPontos).map(p => p.matchId);

                                for (const match of championshipMatches) {
                                    const aAcertou = buchasA.includes(match.id);
                                    const bAcertou = buchasB.includes(match.id);
                                    if (aAcertou && !bAcertou) return -1;
                                    if (!aAcertou && bAcertou) return 1;
                                }
                            }
                            break;
                    }
                }
                const dateA = a.dataCadastro instanceof Date ? a.dataCadastro.getTime() : new Date(a.dataCadastro as string).getTime();
                const dateB = b.dataCadastro instanceof Date ? b.dataCadastro.getTime() : new Date(b.dataCadastro as string).getTime();
                return dateA - dateB;
            });


            const leader = sortedUsers[0] as (UserType & { pontos: number }) | undefined;
            const secondPlace = sortedUsers[1] as (UserType & { pontos: number }) | undefined;
            
            if (!leader) return null;

            let message = "Líder do ranking!";
            if (secondPlace) {
                 const pointsDifference = leader.pontos - secondPlace.pontos;
                if (pointsDifference > 10) {
                    message = "Líder isolado!";
                } else if (pointsDifference <= 3 && pointsDifference > 0) {
                    message = "Disputa acirrada pela ponta!";
                } else if (pointsDifference === 0) {
                    message = "Empatado na liderança!"
                } else {
                     message = "O alvo de todos!";
                }
            }

            return {
                championship,
                leader,
                message
            };
        }).filter(Boolean);

    }, [user, allUsers, userChampionships, liveMatches, allPredictions, allMatches]);

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

    if (authLoading || loadingData || !user) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    }

    const hasContent = userChampionships.length > 0;
    const ghostUser = allUsers.find(u => u.isGhost);

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Bem-vindo, {user.apelido}!</h1>
                        <p className="text-muted-foreground">Boa sorte nos seus próximos palpites.</p>
                    </div>
                </div>
                
                {hasContent ? (
                    <div className="space-y-8">
                         {leaderboards.length > 0 && (
                            <section>
                                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                                {leaderboards.map(lb => {
                                    if (!lb) return null;
                                    const { championship, leader, message } = lb;
                                    return (
                                        <Link
                                            key={championship.id}
                                            href={`/dashboard/leaderboard?championshipId=${championship.id}`}
                                            className="block hover:scale-[1.02] transition-transform duration-200"
                                        >
                                            <Card className="h-full bg-gradient-to-tr from-yellow-400/20 via-background to-background relative overflow-hidden border-yellow-500/50">
                                                <CardHeader className="flex flex-row items-center gap-4 p-4">
                                                    <div className="relative block w-12 h-12">
                                                        <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-amber-600 animate-leader-pulse">
                                                            <Avatar className="w-full h-full border-2 border-background">
                                                                <AvatarImage src={leader.fotoPerfil} alt={leader.apelido} />
                                                                <AvatarFallback>{leader.apelido.substring(0, 2)}</AvatarFallback>
                                                            </Avatar>
                                                        </div>
                                                        <Honorifics count={leader.titulos} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <CardDescription className="flex items-center gap-2 text-xs">
                                                            {championship.iconUrl && <Image src={championship.iconUrl} alt="" width={14} height={14}/>}
                                                            Líder do {championship.nome}
                                                        </CardDescription>
                                                        <div className="flex items-baseline gap-2">
                                                            <CardTitle className="text-xl font-headline text-primary">
                                                                {leader.apelido}
                                                            </CardTitle>
                                                            <p className="text-xl font-headline">{leader.pontos} pts</p>
                                                        </div>
                                                        <p className="font-normal text-sm text-muted-foreground">{message}</p>
                                                    </div>
                                                </CardHeader>
                                                <div className="absolute -bottom-2 -right-2">
                                                    <Trophy className="w-16 h-16 text-yellow-500/20" strokeWidth={1} />
                                                </div>
                                            </Card>
                                        </Link>
                                    )
                                })}
                                </div>
                            </section>
                         )}

                         {upcomingMatches.length > 0 && (
                            <section>
                                 <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                                        <Calendar className="w-6 h-6 text-primary" />
                                        Próximos Jogos
                                    </h2>
                                    <Button asChild variant="link">
                                        <Link href="/dashboard/predictions">Ver todos &rarr;</Link>
                                    </Button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {upcomingMatches.map(match => {
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);
                                        const userPrediction = userPredictions.find(p => p.matchId === match.id);
                                        const ghostPrediction = ghostUser ? allPredictions.find(p => p.matchId === match.id && p.userId === ghostUser.id) : null;
                                        
                                        return (
                                            <Link href={`/dashboard/predictions#${match.id}`} key={match.id} className="block group">
                                                <Card className="h-full hover:border-primary/50 transition-colors">
                                                    <CardContent className="p-4">
                                                        <div className="flex flex-col items-center justify-center w-full gap-2">
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                                                {match.iconUrl && <Image src={match.iconUrl} alt="" width={16} height={16} />}
                                                                {match.campeonato} - {match.fase}
                                                            </div>
                                                            <div className="flex items-center justify-center w-full">
                                                                <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                                    <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                                    <div className='flex h-14 w-14 items-center justify-center'>
                                                                        <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-center text-muted-foreground mx-4">
                                                                    <Swords className="h-6 w-6" />
                                                                </div>
                                                                <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                                    <div className='flex h-14 w-14 items-center justify-center'>
                                                                        <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                    </div>
                                                                    <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                                </div>
                                                            </div>
                                                            <div className='flex flex-col items-center justify-center mt-2 gap-2'>
                                                               <UpcomingMatchDate matchDateString={match.data} />
                                                               {userPrediction && (
                                                                    <div className="font-semibold text-sm">Seu Palpite: {userPrediction.palpiteUsuario.placarA} - {userPrediction.palpiteUsuario.placarB}</div>
                                                                )}
                                                                {ghostPrediction && (
                                                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                                                                        <Ghost className="h-4 w-4 text-primary" />
                                                                        Lóia: {ghostPrediction.palpiteUsuario.placarA} - {ghostPrediction.palpiteUsuario.placarB}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </section>
                         )}

                        {liveMatches.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                                        <Zap className="w-6 h-6 text-accent animate-pulse" />
                                        Acontecendo Agora
                                    </h2>
                                </div>
                                <div className="w-full space-y-4">
                                    {liveMatches.map((match) => {
                                        const championship = allChampionships.find(c => c.id === match.campeonatoId);
                                        const participants = championship?.participantes || [];
                                        
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);

                                        const userPrediction = allPredictions.find(p => p.matchId === match.id && p.userId === user.id);
                                        const { pontos: currentUserLivePoints, acertoTipo: currentUserAcertoTipo } = userPrediction ? calculateLivePoints(match, userPrediction) : { pontos: 0, acertoTipo: 'erro' };
                                        
                                        let cardStatusClass = 'border-accent/50'; // Default for live
                                        if(userPrediction) {
                                            cardStatusClass = getPredictionStatusClass(currentUserAcertoTipo);
                                        } else {
                                            cardStatusClass = 'bg-erro-solid text-white';
                                        }

                                        return (
                                            <Accordion type="single" collapsible className="w-full" key={match.id}>
                                                <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                    <Card className={cn(cardStatusClass)}>
                                                         <AccordionTrigger className="p-4 hover:no-underline w-full relative">
                                                            <div className="flex-1 justify-center items-center">
                                                                <div className="flex items-center justify-center w-full">
                                                                    <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                                        <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                                        <div className='flex h-14 w-14 items-center justify-center'>
                                                                            <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-col items-center justify-center font-bold text-xl md:text-2xl whitespace-nowrap mx-4">
                                                                        <span>{`${match.placarA ?? 0} - ${match.placarB ?? 0}`}</span>
                                                                        <Badge variant="destructive" className='mt-2 animate-pulse'>
                                                                            Ao Vivo
                                                                        </Badge>
                                                                    </div>
                                                                    <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                                        <div className='flex h-14 w-14 items-center justify-center'>
                                                                            <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                        </div>
                                                                        <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 absolute right-4 top-1/2 -translate-y-1/2" />
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="border-t bg-background/80">
                                                                <div className="text-center py-2 text-foreground">
                                                                    <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários</h4>
                                                                </div>
                                                                <ul className="text-sm">
                                                                    {participants.map((participantId) => {
                                                                        const participant = allUsers.find(u => u.id === participantId);
                                                                        if (!participant) return null;

                                                                        const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === participant.id);
                                                                        const { pontos: livePoints, acertoTipo } = prediction ? calculateLivePoints(match, prediction) : { pontos: 0, acertoTipo: 'erro' as const };
                                                                        const isCurrentUser = participant.id === user.id;

                                                                        if (!prediction) {
                                                                            return (
                                                                                <li key={participant.id} className="flex justify-between items-center p-4 border-t bg-erro-solid text-white">
                                                                                     <div className="w-1/3 text-left">
                                                                                        <Link href={`/dashboard/profile?userId=${participant.id}`} className="flex items-center gap-2 group">
                                                                                            <Avatar className="w-8 h-8 opacity-70">
                                                                                                <AvatarImage src={participant.fotoPerfil} alt={participant.apelido} />
                                                                                                <AvatarFallback>{participant.apelido.substring(0,2)}</AvatarFallback>
                                                                                            </Avatar>
                                                                                            <span className="font-bold group-hover:underline">{isCurrentUser ? 'Seu Palpite' : participant.apelido}:</span>
                                                                                        </Link>
                                                                                    </div>
                                                                                    <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">? - ?</span>
                                                                                    <div className="w-1/3 text-right">
                                                                                        <Badge variant="destructive">Sem Palpite</Badge>
                                                                                    </div>
                                                                                </li>
                                                                            );
                                                                        }
                                                                        
                                                                        return (
                                                                            <li key={participant.id} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(acertoTipo))}>
                                                                                <div className="w-1/3 text-left">
                                                                                     <Link href={`/dashboard/profile?userId=${participant.id}`} className="flex items-center gap-2 group">
                                                                                        <Avatar className="w-8 h-8">
                                                                                            <AvatarImage src={participant.fotoPerfil} alt={participant.apelido} />
                                                                                            <AvatarFallback>{participant.apelido.substring(0,2)}</AvatarFallback>
                                                                                        </Avatar>
                                                                                        <div className="flex flex-col sm:items-center sm:flex-row sm:gap-1.5">
                                                                                            <span className="font-bold group-hover:underline">{isCurrentUser ? 'Seu Palpite' : participant.apelido}:</span>
                                                                                        </div>
                                                                                    </Link>
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
                                                                                    {prediction.palpiteCombo && <Gem className={cn("h-4 w-4", acertoTipo === 'combo' && "animate-gem-pulse")} />}
                                                                                    <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(acertoTipo))}>
                                                                                        {livePoints} pts
                                                                                    </Badge>
                                                                                </div>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            </div>
                                                        </AccordionContent>
                                                    </Card>
                                                </AccordionItem>
                                            </Accordion>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {recentMatches.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                                        <History className="w-6 h-6 text-primary" />
                                        Resultados Recentes
                                    </h2>
                                    <Button asChild variant="link">
                                        <Link href="/dashboard/history">Ver histórico completo &rarr;</Link>
                                    </Button>
                                </div>
                                <div className="w-full space-y-4">
                                    {recentMatches.map((match) => {
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);
                                        
                                        const champ = allChampionships.find(c => c.id === match.campeonatoId);
                                        const participants = champ?.participantes || [];

                                        return (
                                            <Accordion type="single" collapsible className="w-full" key={match.id}>
                                            <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                <Card>
                                                <AccordionTrigger className={cn("p-4 hover:no-underline opacity-75", getPredictionStatusClass(userPredictions.find(p => p.matchId === match.id)?.acertoTipo))}>
                                                    <div className="flex flex-col items-center justify-center w-full">
                                                        <div className="flex items-center justify-center w-full">
                                                            <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                                                {match.timeA}
                                                            </div>
                                                            <div className="flex items-center justify-center gap-3 md:gap-4">
                                                                <div className='h-14 w-14 flex items-center justify-center'>
                                                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                                <div className="px-3 py-1">
                                                                    <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                                                </div>
                                                                <div className='h-14 w-14 flex items-center justify-center'>
                                                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                            </div>
                                                            <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                                                {match.timeB}
                                                            </div>
                                                        </div>
                                                        <div className='flex flex-col items-center justify-center mt-2 gap-1'>
                                                            <Badge variant="secondary">{match.status}</Badge>
                                                            <span className={cn("text-xs", getPredictionStatusClass(userPredictions.find(p => p.matchId === match.id)?.acertoTipo).includes('text-white') ? 'text-white/80' : 'text-muted-foreground')}>{format(parseISO(match.data), 'dd/MM/yy', { locale: ptBR })}</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                <div className="bg-background/80 border-t">
                                                    <div className="text-center py-2 text-foreground">
                                                        <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Outros Palpites</h4>
                                                    </div>
                                                    <ul className="text-sm">
                                                    {participants.map((participantId) => {
                                                        const participant = allUsers.find(u => u.id === participantId);
                                                        if (!participant) return null;
                                                        
                                                        const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === participant.id);

                                                        if (!prediction) {
                                                            return (
                                                                <li key={participant.id} className="flex justify-between items-center p-4 border-t bg-erro-solid text-white">
                                                                    <div className="w-1/3 text-left">
                                                                        <Link href={`/dashboard/profile?userId=${participant.id}`} className="flex items-center gap-2 group">
                                                                            <Avatar className="w-8 h-8 opacity-70">
                                                                                <AvatarImage src={participant.fotoPerfil} alt={participant.apelido} />
                                                                                <AvatarFallback>{participant.apelido.substring(0,2)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="font-bold group-hover:underline">{participant.id === user.id ? 'Seu Palpite' : participant.apelido}:</span>
                                                                        </Link>
                                                                    </div>
                                                                    <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">? - ?</span>
                                                                    <div className="w-1/3 text-right">
                                                                        <Badge variant="destructive">Sem Palpite</Badge>
                                                                    </div>
                                                                </li>
                                                            );
                                                        }

                                                        return (
                                                        <li key={participant.id} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(prediction.acertoTipo))}>
                                                        <div className="w-1/3 text-left">
                                                            <Link href={`/dashboard/profile?userId=${prediction.userId}`} className="flex items-center gap-2 group">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={participant.fotoPerfil} alt={participant.apelido} />
                                                                    <AvatarFallback>{participant.apelido.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col sm:items-center sm:flex-row sm:gap-1.5">
                                                                    <span className="font-bold group-hover:underline">{participant.id === user.id ? 'Seu Palpite' : participant.apelido}:</span>
                                                                </div>
                                                            </Link>
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
                                                </div>
                                                </AccordionContent>
                                                </Card>
                                            </AccordionItem>
                                            </Accordion>
                                        );
                                    })}
                                </div>
                            </section>
                        )}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-10 text-center">
                            <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                                <Goal className="w-12 h-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold">Tudo pronto para começar!</h3>
                            <p className="text-muted-foreground mt-2">
                                Você ainda não foi adicionado a um campeonato ativo.
                                <br />
                                Peça ao administrador para incluí-lo e volte para ver as partidas.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    );
}



