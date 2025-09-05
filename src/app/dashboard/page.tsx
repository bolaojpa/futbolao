
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
import { Users, Calendar, History, Zap, AlarmClock, Medal, Trophy, AlertCircle, Goal, LayoutDashboard } from 'lucide-react';
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
import { getMatches, getPredictionsForUser, getUsers, getChampionships, getTeams } from '@/lib/firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [allChampionships, setAllChampionships] = useState<Championship[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const matchRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        if (!authLoading && user) {
            const fetchData = async () => {
                setLoadingData(true);
                try {
                    const [matchesData, usersData, predictionsData, championshipsData, teamsData] = await Promise.all([
                        getMatches(),
                        getUsers(),
                        getPredictionsForUser(user.id),
                        getChampionships(),
                        getTeams(),
                    ]);
                    setAllMatches(matchesData);
                    setAllUsers(usersData);
                    setUserPredictions(predictionsData);
                    setAllChampionships(championshipsData);
                    setAllTeams(teamsData);
                } catch (error) {
                    console.error("Failed to fetch dashboard data:", error);
                } finally {
                    setLoadingData(false);
                }
            };
            fetchData();
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

    const liveMatches = useMemo(() => {
        return allMatches
            .filter(match => match.status === 'Ao Vivo')
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [allMatches]);

    const upcomingMatches = useMemo(() => {
        return allMatches
            .filter(match => match.status === 'Agendado' && !isPast(parseISO(match.data)))
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 6); // Limit to 6 upcoming matches on dashboard
    }, [allMatches]);

    const recentMatches = useMemo(() => {
        return allMatches
            .filter(match => match.status === 'Finalizado')
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 3); // Limit to 3 recent matches
    }, [allMatches]);

    const sortedUsers = useMemo(() => {
        if (allUsers.length === 0) return [];
        return [...allUsers].sort((a, b) => {
            if (a.pontos !== b.pontos) return b.pontos - a.pontos;
            if (a.exatos !== b.exatos) return b.exatos - a.exatos;
            return new Date(a.dataCadastro as string).getTime() - new Date(b.dataCadastro as string).getTime();
        });
    }, [allUsers]);

    const leader = sortedUsers[0];
    const secondPlace = sortedUsers[1];
    
    // Condição para exibir o card de líder
    const showLeaderCard = leader && leader.pontos > 0;

    const getLeaderMessage = () => {
        if (!leader || !secondPlace) return "Líder do ranking!";
        const pointsDifference = leader.pontos - secondPlace.pontos;
        if (pointsDifference > 10) {
            return "Líder isolado!";
        }
        if (pointsDifference <= 3) {
            return "Disputa acirrada pela ponta!";
        }
        return "O alvo de todos!";
    };

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

    const getPredictionStatusClass = (pontos?: number, maxPontos?: number) => {
        if (pontos === undefined || maxPontos === undefined) return '';
        if (pontos === maxPontos && maxPontos > 0) return 'bg-green-100/80 dark:bg-green-900/40';
        if (pontos > 0) return 'bg-blue-100/80 dark:bg-blue-900/40';
        return 'bg-red-100/80 dark:bg-red-900/40';
    };

    const getPointsBadgeVariant = (pontos?: number, maxPontos?: number): "success" | "default" | "destructive" => {
        if (pontos === undefined || maxPontos === undefined) return 'default';
        if (pontos === maxPontos && maxPontos > 0) return 'success';
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

                <div className="space-y-8">
                    {showLeaderCard && (
                        <section>
                            <Card className="bg-gradient-to-tr from-yellow-400/20 via-background to-background relative overflow-hidden border-yellow-500/50">
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
                                        <CardDescription className="flex items-center gap-2 text-xs"><Trophy className="w-4 h-4 text-yellow-500"/>Líder do Ranking</CardDescription>
                                        <div className="flex items-baseline gap-2">
                                            <CardTitle className="text-xl font-headline text-primary">
                                            <Link href={`/dashboard/profile?userId=${leader.id}`} className="hover:underline">{leader.apelido}</Link>
                                            </CardTitle>
                                            <p className="text-xl font-headline">{leader.pontos} pts</p>
                                        </div>
                                        <p className="font-normal text-sm text-muted-foreground">{getLeaderMessage()}</p>
                                    </div>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href="/dashboard/leaderboard">
                                            Ver Ranking
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <div className="absolute -bottom-2 -right-2">
                                    <Medal className="w-16 h-16 text-yellow-500/20" strokeWidth={1} />
                                </div>
                            </Card>
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
                                    const prediction = userPredictions.find(p => p.matchId === match.id);
                                    if (!prediction) return null;
                                    const teamA = allTeams.find(t => t.name === match.timeA);
                                    const teamB = allTeams.find(t => t.name === match.timeB);

                                    return (
                                        <Accordion type="single" collapsible className="w-full" key={match.id}>
                                            <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                                <Card className='border-accent/50'>
                                                    <AccordionTrigger className="p-4 hover:no-underline">
                                                        <div className="flex flex-col items-center justify-center w-full">
                                                            <div className="flex items-center justify-center w-full">
                                                                <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                                    <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                                                </div>
                                                                <div className="flex flex-col items-center justify-center font-bold text-xl md:text-2xl whitespace-nowrap mx-4">
                                                                    <span>{`${match.placarA ?? 0}`} - {`${match.placarB ?? 0}`}</span>
                                                                    <Badge variant="destructive" className='mt-2 animate-pulse'>
                                                                        Ao Vivo
                                                                    </Badge>
                                                                </div>
                                                                <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                                                    <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="p-4 border-t">
                                                            <div className="flex justify-between items-center w-full">
                                                                <div className="w-1/3 text-left flex items-center gap-2">
                                                                    <Avatar className="w-8 h-8">
                                                                        <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                                        <AvatarFallback>{user.apelido.substring(0, 2)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-bold">Seu Palpite:</span>
                                                                </div>
                                                                <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                                                <div className="w-1/3 text-right">
                                                                </div>
                                                            </div>
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
                                                            <Image src={championship.iconUrl} alt={championship.nome} width={20} height={20} className="rounded-sm" data-ai-hint="championship logo" />
                                                        )}
                                                        <p className="text-xs text-muted-foreground font-semibold">{match.campeonato}</p>
                                                    </div>
                                                    <div className="flex items-center justify-around w-full text-center">
                                                        <div className='flex flex-col items-center gap-2 w-1/3'>
                                                            <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                                            <p className="font-semibold text-sm truncate hidden md:block w-full">{match.timeA}</p>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center gap-1 mx-2">
                                                            <Badge variant={getStatusVariant(displayStatus)}>
                                                                {displayStatus}
                                                            </Badge>
                                                            <span className="text-2xl font-bold text-muted-foreground">vs</span>
                                                        </div>
                                                        <div className='flex flex-col items-center gap-2 w-1/3'>
                                                            <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
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

                                    return (
                                        <Accordion type="single" collapsible className="w-full" key={match.id}>
                                        <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden" id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                            <Card>
                                            <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction?.pontos, match.maxPontos))}>
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    <div className="flex items-center justify-center w-full">
                                                        <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                                            {match.timeA}
                                                        </div>
                                                        <div className="flex items-center justify-center gap-3 md:gap-4">
                                                            <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                                            <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                                            <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
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
                                                <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos, match.maxPontos))}>
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
                                                            <Badge variant={getPointsBadgeVariant(prediction.pontos, match.maxPontos)} className='whitespace-nowrap'>
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
            </div>
        </TooltipProvider>
    );
}

    