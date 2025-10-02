

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
import { Users, Calendar, History, Zap, AlarmClock, Medal, Trophy, AlertCircle, Goal, LayoutDashboard, ChevronDown, HelpCircle, Gem } from 'lucide-react';
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

    const liveMatches = useMemo(() => {
        if (userChampionships.length === 0) return [];
        const userChampionshipIds = userChampionships.map(c => c.id);
        return allMatches
            .filter(match => userChampionshipIds.includes(match.campeonatoId) && (match.status === 'Ao Vivo' || (match.status === 'Agendado' && isPast(parseISO(match.data)))))
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [allMatches, userChampionships, currentTime]);

    const upcomingMatches = useMemo(() => {
        if (userChampionships.length === 0) return [];
        const userChampionshipIds = userChampionships.map(c => c.id);
        return allMatches
            .filter(match => userChampionshipIds.includes(match.campeonatoId) && match.status === 'Agendado' && !isPast(parseISO(match.data)))
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 6); 
    }, [allMatches, userChampionships, currentTime]);

    const recentMatches = useMemo(() => {
        if (userChampionships.length === 0) return [];
        const userChampionshipIds = userChampionships.map(c => c.id);
        return allMatches
            .filter(match => userChampionshipIds.includes(match.campeonatoId) && match.status === 'Finalizado')
            .sort((a, b) => new Date(b.data).getTime() - new Date(b.data).getTime())
            .slice(0, 3);
    }, [allMatches, userChampionships]);

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
            if (acertouGols) {
                pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
                acertoTipo = 'combo';
            }
        } else if (acertouSituacao) {
            pontosGanhos = pontuacao.tradicional.situacao;
            acertoTipo = 'situacao';
             if (acertouGols) {
                pontosGanhos += pontuacao.combo.pontosGols;
                acertoTipo = 'bonus';
            }
        } else if (acertouGols) {
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


    const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
        if (status === 'Ao Vivo') return 'destructive';
        if (status === 'Agendado' || status === 'Hoje') return 'secondary';
        return 'default';
    };
    
    const getMatchDisplayStatus = (matchDate: string, currentStatus: string) => {
        if (currentStatus === 'Agendado' && isToday(parseISO(matchDate))) {
            return 'Hoje';
        }
        return currentStatus;
    };

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

    if (authLoading || loadingData || !user) {
        return <div className="p-8 space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    }

    const hasContent = userChampionships.length > 0;

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
                                        <Card key={championship.id} className="bg-gradient-to-tr from-yellow-400/20 via-background to-background relative overflow-hidden border-yellow-500/50">
                                            <CardHeader className="flex flex-row items-center gap-4 p-4">
                                                <Link href={`/dashboard/profile?userId=${leader.id}`} className="relative block w-12 h-12">
                                                    <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-amber-600 animate-leader-pulse">
                                                        <Avatar className="w-full h-full border-2 border-background">
                                                            <AvatarImage src={leader.fotoPerfil} alt={leader.apelido} />
                                                            <AvatarFallback>{leader.apelido.substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                    </div>
                                                    <Honorifics count={leader.titulos} />
                                                </Link>
                                                <div className="flex-1">
                                                    <CardDescription className="flex items-center gap-2 text-xs">
                                                        {championship.iconUrl && <Image src={championship.iconUrl} alt="" width={14} height={14}/>}
                                                        Líder do {championship.nome}
                                                    </CardDescription>
                                                    <div className="flex items-baseline gap-2">
                                                        <CardTitle className="text-xl font-headline text-primary">
                                                        <Link href={`/dashboard/profile?userId=${leader.id}`} className="hover:underline">{leader.apelido}</Link>
                                                        </CardTitle>
                                                        <p className="text-xl font-headline">{leader.pontos} pts</p>
                                                    </div>
                                                    <p className="font-normal text-sm text-muted-foreground">{message}</p>
                                                </div>
                                                <Button asChild variant="ghost" size="sm">
                                                    <Link href={`/dashboard/leaderboard?championshipId=${championship.id}`}>
                                                        Ver Ranking
                                                    </Link>
                                                </Button>
                                            </CardHeader>
                                            <div className="absolute -bottom-2 -right-2">
                                                <Trophy className="w-16 h-16 text-yellow-500/20" strokeWidth={1} />
                                            </div>
                                        </Card>
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
                                        const userPrediction = userPredictions.find(p => p.matchId === match.id);
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);
                                        const otherPredictions = allPredictions.filter(p => p.matchId === match.id && p.userId !== user.id);
                                        const { pontos: currentUserLivePoints, acertoTipo: currentUserAcertoTipo } = userPrediction ? calculateLivePoints(match, userPrediction) : { pontos: 0, acertoTipo: 'erro' };
                                        
                                        const champ = allChampionships.find(c => c.id === match.campeonatoId);
                                        
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
                                                                    {userPrediction ? (
                                                                        <li className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(currentUserAcertoTipo))}>
                                                                            <div className="w-1/3 text-left flex items-center gap-2 group">
                                                                                <Avatar className="w-8 h-8">
                                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                                </Avatar>
                                                                                 <div className="flex items-center gap-1.5">
                                                                                    <span className="font-bold">Seu Palpite:</span>
                                                                                     {champ?.championPredictionSettings?.active && (() => {
                                                                                        const userChampPicks = user.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                                                        const chosenTeams = userChampPicks ? userChampPicks.teams.map((teamName, index) => {
                                                                                            const team = allTeams.find(t => t.name === teamName);
                                                                                            const isEliminated = (champ.finalRanking ? Object.values(champ.finalRanking) : []).length > 0 && !(champ.finalRanking ? Object.values(champ.finalRanking) : []).includes(teamName);
                                                                                            return team ? { ...team, pickOrder: index + 1, isEliminated } : null;
                                                                                        }).filter((t): t is Team & { pickOrder: number, isEliminated: boolean } => t !== null) : [];

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
                                                                                    <span>{userPrediction.palpiteUsuario.placarA}-{userPrediction.palpiteUsuario.placarB}</span>
                                                                                </div>
                                                                                {userPrediction.palpiteCombo && (
                                                                                    <div className="absolute right-0 sm:left-full sm:ml-2 flex items-center gap-1">
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger>
                                                                                                <div className="flex items-center gap-1">
                                                                                                    <Goal className="h-4 w-4" />
                                                                                                    <span>{userPrediction.palpiteCombo.totalGols}</span>
                                                                                                </div>
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent><p>Seu palpite de gols para o combo.</p></TooltipContent>
                                                                                        </Tooltip>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="w-1/3 text-right flex items-center justify-end gap-2">
                                                                                {userPrediction.palpiteCombo && <Gem className={cn("h-4 w-4", currentUserAcertoTipo === 'combo' && "animate-gem-pulse")} />}
                                                                                <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(currentUserAcertoTipo))}>
                                                                                    {currentUserLivePoints} pts
                                                                                </Badge>
                                                                            </div>
                                                                        </li>
                                                                    ) : (
                                                                        <li className="flex justify-between items-center p-4 border-t bg-erro-solid text-white">
                                                                            <div className="w-1/3 text-left flex items-center gap-2 group">
                                                                                <Avatar className="w-8 h-8 opacity-70">
                                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-bold">Seu Palpite:</span>
                                                                            </div>
                                                                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">? - ?</span>
                                                                            <div className="w-1/3 text-right">
                                                                                <Badge variant="destructive">Sem Palpite</Badge>
                                                                            </div>
                                                                        </li>
                                                                    )}
                                                                    {otherPredictions.map((p, i) => {
                                                                        const otherUser = allUsers.find(u => u.id === p.userId);
                                                                        if (!otherUser) return null;
                                                                        const { pontos: otherLivePoints, acertoTipo: otherAcertoTipo } = calculateLivePoints(match, p);

                                                                        return (
                                                                            <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(otherAcertoTipo))}>
                                                                                <div className="w-1/3 text-left">
                                                                                    <Link href={`/dashboard/profile?userId=${p.userId}`} className="flex items-center gap-2 group">
                                                                                        <Avatar className="w-8 h-8">
                                                                                            <AvatarImage src={otherUser.fotoPerfil} alt={otherUser.apelido} />
                                                                                            <AvatarFallback>{otherUser.apelido.substring(0,2)}</AvatarFallback>
                                                                                        </Avatar>
                                                                                         <div className="flex items-center gap-1.5">
                                                                                            <span className="font-bold group-hover:underline">{otherUser.apelido}:</span>
                                                                                             {champ?.championPredictionSettings?.active && (() => {
                                                                                                const champPicks = otherUser.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                                                                const chosenTeams = champPicks ? champPicks.teams.map((teamName, index) => {
                                                                                                    const team = allTeams.find(t => t.name === teamName);
                                                                                                    const isEliminated = (champ.finalRanking ? Object.values(champ.finalRanking) : []).length > 0 && !(champ.finalRanking ? Object.values(champ.finalRanking) : []).includes(teamName);
                                                                                                    return team ? { ...team, pickOrder: index + 1, isEliminated: boolean } : null;
                                                                                                }).filter((t): t is Team & { pickOrder: number, isEliminated: boolean } => t !== null) : [];
                                                                                                
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
                                                                                    </Link>
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
                                                                                    {p.palpiteCombo && <Gem className={cn("h-4 w-4", otherAcertoTipo === 'combo' && "animate-gem-pulse")} />}
                                                                                    <Badge className={cn('whitespace-nowrap', getPointsBadgeClass(otherAcertoTipo))}>
                                                                                        {otherLivePoints} pts
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

                        {upcomingMatches.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                                        <Calendar className="w-6 h-6 text-primary" />
                                        Próximas Partidas
                                    </h2>
                                    <Button asChild variant="link">
                                        <Link href="/dashboard/predictions">Ver todos &rarr;</Link>
                                    </Button>
                                </div>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {upcomingMatches.map((match) => {
                                        const userPrediction = userPredictions.find(p => p.matchId === match.id);
                                        const needsAttention = differenceInHours(parseISO(match.data), new Date()) < 2 && !userPrediction;
                                        const championship = allChampionships.find(c => c.id === match.campeonatoId);
                                        const displayStatus = getMatchDisplayStatus(match.data, match.status);
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);

                                        return (
                                            <Link href={`/dashboard/predictions?championshipId=${match.campeonatoId}#${match.id}`} key={match.id} className="block hover:scale-[1.02] transition-transform duration-200">
                                                <Card className={cn(
                                                    "relative flex flex-col h-full overflow-hidden",
                                                    needsAttention && "border-accent animate-pulse"
                                                )}>
                                                    {needsAttention && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="absolute top-2 left-2 z-10">
                                                                    <AlertCircle className="h-5 w-5 text-accent animate-pulse" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p>Seu palpite é necessário! Esta partida começa em breve.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <CardContent className="flex-grow flex flex-col justify-center items-center p-4">
                                                        <div className="flex justify-center items-center gap-2 mb-2">
                                                            {championship?.iconUrl && (
                                                                <Image src={championship.iconUrl} alt={championship.nome} width={20} height={20} className="object-contain" data-ai-hint="championship logo" />
                                                            )}
                                                            <p className="text-xs text-muted-foreground font-semibold">{match.campeonato}</p>
                                                        </div>
                                                        <div className="flex items-center justify-around w-full text-center">
                                                            <div className='flex flex-col items-center gap-2 w-1/3'>
                                                                 <div className="h-14 w-14 flex items-center justify-center">
                                                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                                <p className="font-semibold text-sm truncate hidden md:block w-full">{match.timeA}</p>
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center gap-1 mx-2">
                                                                <Badge variant={getStatusVariant(displayStatus)}>
                                                                    {displayStatus}
                                                                </Badge>
                                                                <span className="text-2xl font-bold text-muted-foreground">vs</span>
                                                            </div>
                                                            <div className='flex flex-col items-center gap-2 w-1/3'>
                                                                <div className="h-14 w-14 flex items-center justify-center">
                                                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                                <p className="font-semibold text-sm truncate hidden md:block w-full">{match.timeB}</p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                    
                                                    {userPrediction && (
                                                        <CardContent className="py-2">
                                                            <Separator className="mb-2" />
                                                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                                                <Goal className="w-4 h-4 text-primary" />
                                                                <span className="font-semibold">Seu Palpite:</span>
                                                                <span className="font-bold text-foreground">{`${userPrediction.palpiteUsuario.placarA} - ${userPrediction.palpiteUsuario.placarB}`}</span>
                                                            </div>
                                                        </CardContent>
                                                    )}

                                                    <CardContent className="text-center bg-muted/50 py-2 mt-auto">
                                                    <UpcomingMatchDate matchDateString={match.data} />
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        )
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
                                        const prediction = userPredictions.find(p => p.matchId === match.id);
                                        const teamA = allTeams.find(t => t.name === match.timeA);
                                        const teamB = allTeams.find(t => t.name === match.timeB);
                                        const champ = allChampionships.find(c => c.id === match.campeonatoId);
                                        const otherPredictions = allPredictions.filter(p => p.matchId === match.id && p.userId !== user.id);

                                        return (
                                            <Accordion type="single" collapsible className="w-full" key={match.id}>
                                            <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                <Card>
                                                <AccordionTrigger className={cn("p-4 hover:no-underline opacity-75", getPredictionStatusClass(prediction?.acertoTipo))}>
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
                                                            <span className={cn("text-xs", getPredictionStatusClass(prediction?.acertoTipo).includes('text-white') ? 'text-white/80' : 'text-muted-foreground')}>{format(parseISO(match.data), 'dd/MM/yy', { locale: ptBR })}</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                {prediction && (
                                                    <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.acertoTipo))}>
                                                        <div className="flex justify-between items-center w-full">
                                                            <div className="w-1/3 text-left flex items-center gap-2">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold">Seu Palpite:</span>
                                                                    {champ?.championPredictionSettings?.active && (() => {
                                                                        const userChampPicks = user.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                                        const chosenTeams = userChampPicks ? userChampPicks.teams.map((teamName, index) => {
                                                                            const team = allTeams.find(t => t.name === teamName);
                                                                            const isEliminated = (champ.finalRanking ? Object.values(champ.finalRanking) : []).length > 0 && !(champ.finalRanking ? Object.values(champ.finalRanking) : []).includes(teamName);
                                                                            return team ? { ...team, pickOrder: index + 1, isEliminated } : null;
                                                                        }).filter((t): t is Team & { pickOrder: number, isEliminated: boolean } => t !== null) : [];

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
                                                                {prediction.palpiteCombo && (
                                                                    <div className="absolute right-0 sm:left-full sm:ml-2 flex items-center gap-1">
                                                                        <Tooltip>
                                                                            <TooltipTrigger>
                                                                                <div className="flex items-center gap-1">
                                                                                    <Goal className="h-4 w-4" />
                                                                                    <span>{prediction.palpiteCombo.totalGols}</span>
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent><p>Seu palpite de gols (Combo)</p></TooltipContent>
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
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bg-background/80 border-t">
                                                    <div className="text-center py-2 text-foreground">
                                                        <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Outros Palpites</h4>
                                                    </div>
                                                    <ul className="text-sm">
                                                    {otherPredictions.map((p, i) => {
                                                        const otherUser = allUsers.find(u => u.id === p.userId);
                                                        if (!otherUser) return null;

                                                        return (
                                                        <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.acertoTipo))}>
                                                        <div className="w-1/3 text-left">
                                                            <Link href={`/dashboard/profile?userId=${p.userId}`} className="flex items-center gap-2 group">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={otherUser.fotoPerfil} alt={otherUser.apelido} />
                                                                    <AvatarFallback>{otherUser.apelido.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold group-hover:underline">{otherUser.apelido}:</span>
                                                                    {champ?.championPredictionSettings?.active && (() => {
                                                                        const champPicks = otherUser.championPicks?.find(cp => cp.championshipId === match.campeonatoId);
                                                                        const chosenTeams = champPicks ? champPicks.teams.map((teamName, index) => {
                                                                            const team = allTeams.find(t => t.name === teamName);
                                                                            const isEliminated = (champ.finalRanking ? Object.values(champ.finalRanking) : []).length > 0 && !(champ.finalRanking ? Object.values(champ.finalRanking) : []).includes(teamName);
                                                                            return team ? { ...team, pickOrder: index + 1, isEliminated: boolean } : null;
                                                                        }).filter((t): t is Team & { pickOrder: number, isEliminated: boolean } => t !== null) : [];
                                                                        
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
                                                            </Link>
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
