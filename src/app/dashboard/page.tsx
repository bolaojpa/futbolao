

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
import { Users, Calendar, History, Zap, AlarmClock, Medal, Trophy, AlertCircle, Goal, LayoutDashboard, ChevronDown, HelpCircle } from 'lucide-react';
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

    const calculateLivePoints = (match: Match, prediction: Prediction): { pontos: number, isExact: boolean, isSituation: boolean } => {
        const livePlacarA = match.placarA ?? 0;
        const livePlacarB = match.placarB ?? 0;
        
        const championship = allChampionships.find(c => c.id === match.campeonatoId);
        if (!championship) return { pontos: 0, isExact: false, isSituation: false };

        const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
        const pontuacao = championship.pontuacao.tradicional;

        if (guessA === livePlacarA && guessB === livePlacarB) {
            return { pontos: pontuacao.exato, isExact: true, isSituation: false }; 
        }

        const liveWinner = livePlacarA > livePlacarB ? 'A' : livePlacarA < livePlacarB ? 'B' : 'E';
        const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';

        if (liveWinner === guessWinner) {
            return { pontos: pontuacao.situacao, isExact: false, isSituation: true };
        }

        return { pontos: 0, isExact: false, isSituation: false };
    };
    
    const leaderboards = useMemo(() => {
        const activeChampionships = userChampionships.filter(c => c.status === 'ativo');
        if (allUsers.length === 0 || activeChampionships.length === 0) return [];

        return activeChampionships.map(championship => {
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
                            if (result.isExact) baseExatos++;
                            if (result.isSituation) baseSituacoes++;
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
                            if (a.situacoes !== b.situacoes) return b.situacoes - b.situacoes;
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

    }, [allUsers, userChampionships, liveMatches, allPredictions, allMatches]);


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

    const getPredictionStatusClass = (pontos?: number, isExact?: boolean) => {
        if (pontos === undefined) return 'bg-red-100/80 dark:bg-red-900/40';
        if (isExact) return 'bg-green-100/80 dark:bg-green-900/40';
        if (pontos > 0) return 'bg-blue-100/80 dark:bg-blue-900/40';
        return 'bg-red-100/80 dark:bg-red-900/40';
    };

    const getPointsBadgeVariant = (pontos?: number, isExact?: boolean): "success" | "default" | "destructive" => {
        if (pontos === undefined) return 'destructive';
        if (isExact) return 'success';
        if (pontos > 0) return 'default';
        return 'destructive';
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
                                <div className="grid gap-4 md:grid-cols-2">
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
                                        const { pontos: currentUserLivePoints, isExact: isCurrentUserExact } = userPrediction ? calculateLivePoints(match, userPrediction) : { pontos: 0, isExact: false };
                                        
                                        let cardStatusClass = 'border-accent/50'; // Default for live
                                        if(userPrediction) {
                                            cardStatusClass = getPredictionStatusClass(currentUserLivePoints, isCurrentUserExact);
                                        } else {
                                            cardStatusClass = 'bg-red-100/80 dark:bg-red-900/40';
                                        }

                                        return (
                                            <Accordion type="single" collapsible className="w-full" key={match.id}>
                                                <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                    <Card className={cn(cardStatusClass)}>
                                                         <AccordionTrigger className="p-4 hover:no-underline">
                                                            <div className="flex flex-col items-center justify-center w-full">
                                                                <div className="flex items-center justify-center w-full">
                                                                    <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                                        <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                                        <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={48} className="object-contain" data-ai-hint="team logo" />
                                                                    </div>
                                                                    <div className="flex flex-col items-center justify-center font-bold text-xl md:text-2xl whitespace-nowrap mx-4">
                                                                        <span>{`${match.placarA ?? 0} - ${match.placarB ?? 0}`}</span>
                                                                        <Badge variant="destructive" className='mt-2 animate-pulse'>
                                                                            Ao Vivo
                                                                        </Badge>
                                                                    </div>
                                                                    <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                                        <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={48} className="object-contain" data-ai-hint="team logo" />
                                                                        <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto" />
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <div className="bg-background/80 border-t">
                                                                <div className="text-center py-2">
                                                                    <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários</h4>
                                                                </div>
                                                                <ul className="text-sm">
                                                                    {userPrediction ? (
                                                                        <li className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(currentUserLivePoints, isCurrentUserExact))}>
                                                                            <div className="w-1/3 text-left flex items-center gap-2 group">
                                                                                <Avatar className="w-8 h-8">
                                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-bold">Seu Palpite:</span>
                                                                            </div>
                                                                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{userPrediction.palpiteUsuario.placarA}-{userPrediction.palpiteUsuario.placarB}</span>
                                                                            <div className="w-1/3 text-right">
                                                                                <Badge variant={getPointsBadgeVariant(currentUserLivePoints, isCurrentUserExact)} className='whitespace-nowrap'>
                                                                                    {currentUserLivePoints} pts
                                                                                </Badge>
                                                                            </div>
                                                                        </li>
                                                                    ) : (
                                                                        <li className="flex justify-between items-center p-4 border-t bg-red-100/80 dark:bg-red-900/40">
                                                                            <div className="w-1/3 text-left flex items-center gap-2 group">
                                                                                <Avatar className="w-8 h-8 opacity-70">
                                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                                </Avatar>
                                                                                <span className="font-bold">Seu Palpite:</span>
                                                                            </div>
                                                                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap text-destructive">? - ?</span>
                                                                            <div className="w-1/3 text-right">
                                                                                <Badge variant="destructive">Sem Palpite</Badge>
                                                                            </div>
                                                                        </li>
                                                                    )}
                                                                    {otherPredictions.map((p, i) => {
                                                                        const otherUser = allUsers.find(u => u.id === p.userId);
                                                                        if (!otherUser) return null;
                                                                        const { pontos: otherLivePoints, isExact: isOtherExact } = calculateLivePoints(match, p);
                                                                        return (
                                                                            <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(otherLivePoints, isOtherExact))}>
                                                                                <div className="w-1/3 text-left">
                                                                                    <Link href={`/dashboard/profile?userId=${p.userId}`} className="flex items-center gap-2 group">
                                                                                        <Avatar className="w-8 h-8">
                                                                                            <AvatarImage src={otherUser.fotoPerfil} alt={otherUser.apelido} />
                                                                                            <AvatarFallback>{otherUser.apelido.substring(0,2)}</AvatarFallback>
                                                                                        </Avatar>
                                                                                        <span className="font-bold group-hover:underline">{otherUser.apelido}:</span>
                                                                                    </Link>
                                                                                </div>
                                                                                <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpiteUsuario.placarA}-{p.palpiteUsuario.placarB}</span>
                                                                                <div className="w-1/3 text-right">
                                                                                    <Badge variant={getPointsBadgeVariant(otherLivePoints, isOtherExact)} className='whitespace-nowrap'>
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
                                            <Link href="/dashboard/predictions" key={match.id} className="block hover:scale-[1.02] transition-transform duration-200">
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
                                                                <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={48} height={40} className="object-contain" data-ai-hint="team logo" />
                                                                <p className="font-semibold text-sm truncate hidden md:block w-full">{match.timeA}</p>
                                                            </div>
                                                            <div className="flex flex-col items-center justify-center gap-1 mx-2">
                                                                <Badge variant={getStatusVariant(displayStatus)}>
                                                                    {displayStatus}
                                                                </Badge>
                                                                <span className="text-2xl font-bold text-muted-foreground">vs</span>
                                                            </div>
                                                            <div className='flex flex-col items-center gap-2 w-1/3'>
                                                                <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={48} height={40} className="object-contain" data-ai-hint="team logo" />
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
                                        const maxPontos = champ?.pontuacao.tradicional.exato ?? 0;
                                        const isExact = prediction?.pontos === maxPontos && maxPontos > 0;

                                        return (
                                            <Accordion type="single" collapsible className="w-full" key={match.id}>
                                            <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                <Card>
                                                <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction?.pontos, isExact))}>
                                                    <div className="flex flex-col items-center justify-center w-full">
                                                        <div className="flex items-center justify-center w-full">
                                                            <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                                                {match.timeA}
                                                            </div>
                                                            <div className="flex items-center justify-center gap-3 md:gap-4">
                                                                <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={48} className="object-contain" data-ai-hint="team logo" />
                                                                <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                                                <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={48} className="object-contain" data-ai-hint="team logo" />
                                                            </div>
                                                            <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                                                {match.timeB}
                                                            </div>
                                                        </div>
                                                        <div className='flex flex-col items-center justify-center mt-2 gap-1'>
                                                            <Badge variant="secondary">{match.status}</Badge>
                                                            <span className="text-xs text-muted-foreground">{format(parseISO(match.data), 'dd/MM/yy', { locale: ptBR })}</span>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                {prediction && (
                                                    <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos, isExact))}>
                                                        <div className="flex justify-between items-center w-full">
                                                            <div className="w-1/3 text-left flex items-center gap-2">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                    <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-bold">Seu Palpite:</span>
                                                            </div>
                                                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                                            <div className="w-1/3 text-right">
                                                                <Badge variant={getPointsBadgeVariant(prediction.pontos, isExact)} className='whitespace-nowrap'>
                                                                    {prediction.pontos} pts
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
