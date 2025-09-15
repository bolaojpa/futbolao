

"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInHours, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, Loader2, Wand2, Save, ChevronUp, ChevronDown, AlarmClock, Calendar, AlertCircle, Lock, CalendarCheck, Goal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestion, savePrediction, saveChampionPicks } from '@/app/dashboard/predictions/actions';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Countdown } from '@/components/shared/countdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import type { Match, Prediction, Team, Championship, UserType } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getMatches, getPredictionsForUser, getTeams, getUsers, getChampionships as fetchChampionships } from '@/lib/firebase/firestore';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { ChampionPrediction } from '@/components/rules/champion-prediction';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';

const NumberInput = ({ value, onChange }: { value: number | null; onChange: (value: number) => void; }) => {
    const handleIncrement = () => {
        const currentValue = value ?? -1;
        onChange(currentValue + 1);
    };
    const handleDecrement = () => {
        const currentValue = value ?? 1;
        onChange(Math.max(0, currentValue - 1));
    };

    return (
        <div className="relative w-20">
            <Input
                type="text"
                readOnly
                value={value === null ? '' : value}
                className="w-full h-12 text-center text-2xl font-bold bg-muted border-0 pr-6"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-full">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleIncrement}>
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleDecrement}>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


export default function PredictionsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [aiModalState, setAiModalState] = useState<{ open: boolean; suggestion: string | null; justification: string | null; match: Match | null }>({ open: false, suggestion: null, justification: null, match: null });
    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [scores, setScores] = useState<Record<string, { placarA: number | null; placarB: number | null }>>({});
    
    const matchRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // Check every second for real-time updates
        return () => clearInterval(timer);
    }, []);

    const activeChampionshipsForUser = useMemo(() => {
        if (!user) return [];
        return championships.filter(c => c.status === 'ativo' && c.participantes.includes(user.id));
    }, [championships, user]);

    const displayedMatches = useMemo(() => {
        if (activeChampionshipsForUser.length === 0) return [];
        const activeChampIds = activeChampionshipsForUser.map(c => c.id);
        
        return allMatches
            .filter(match => {
                if (match.status !== 'Agendado') return false;
                if (!activeChampIds.includes(match.campeonatoId)) return false;
                return !isPast(parseISO(match.data));
            })
            .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [allMatches, activeChampionshipsForUser, currentTime]);


    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }

        async function fetchStaticData() {
            setLoadingData(true);
            try {
                const [teamsData, usersData, championshipsData] = await Promise.all([getTeams(), getUsers(), fetchChampionships()]);
                setAllTeams(teamsData);
                setAllUsers(usersData);
                setChampionships(championshipsData);
            } catch (error) {
                toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar equipes, usuários e campeonatos.", variant: "destructive" });
            } finally {
                setLoadingData(false);
            }
        }
        fetchStaticData();
        
        const unsubMatches = onSnapshot(collection(db, 'matches'), (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setAllMatches(matchesData);
        });

        const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
            const allPreds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
            setAllPredictions(allPreds);

            const predictionsData = allPreds.filter(p => p.userId === user.id);
            setUserPredictions(predictionsData);

            // Update local state based on Firestore predictions
            const initialScores: Record<string, { placarA: number | null; placarB: number | null }> = {};
            const initialUpdates: Record<string, Date | null> = {};
            predictionsData.forEach(p => {
                initialScores[p.matchId] = { placarA: p.palpiteUsuario.placarA, placarB: p.palpiteUsuario.placarB };
                if (p.updatedAt) {
                    initialUpdates[p.matchId] = p.updatedAt.toDate();
                }
            });
            setScores(prev => ({ ...prev, ...initialScores }));
            setLastUpdated(prev => ({ ...prev, ...initialUpdates }));
        });

        if (window.location.hash) {
            const matchId = window.location.hash.substring(1);
            setTimeout(() => { 
                const element = matchRefs.current[matchId];
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 500); 
        }

        return () => {
            unsubMatches();
            unsubPredictions();
        };

    }, [authLoading, user, router, toast]);

    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: null, placarB: null }),
                [team]: value,
            },
        }));
    };

    const handlePredictionSubmit = async (match: Match) => {
        if (!user) return;

        const liveMatch = await getDoc(doc(db, 'matches', match.id));
        const liveMatchData = liveMatch.data() as Match;

        if (isPast(parseISO(liveMatchData.data)) || liveMatchData.predictionsLocked) {
            toast({
                title: "Tempo Esgotado!",
                description: "Esta partida já começou ou está bloqueada para palpites.",
                variant: "destructive",
            });
             setAllMatches(prev => prev.filter(m => m.id !== match.id));
            return;
        }

        const currentScore = scores[match.id];
        if (currentScore.placarA === null || currentScore.placarB === null) return;
        
        const isEditing = !!lastUpdated[match.id];

        try {
            await savePrediction({
                matchId: match.id,
                userId: user.id,
                palpiteUsuario: {
                    placarA: currentScore.placarA,
                    placarB: currentScore.placarB,
                }
            });

            toast({
                title: `Palpite ${isEditing ? 'Alterado' : 'Enviado'}!`,
                description: `Seu palpite foi ${isEditing ? 'atualizado' : 'registrado'} com sucesso. Boa sorte!`,
                variant: "default",
            });
            // Firestore listener will update the 'lastUpdated' state implicitly.
        } catch (error) {
            toast({ title: "Erro ao salvar palpite", description: "Não foi possível salvar seu palpite. Tente novamente.", variant: "destructive" });
        }
    };

    const handleAiSuggestion = async (match: Match) => {
        if (!user) return;
        setLoadingAi(prev => ({ ...prev, [match.id]: true }));
        
        const championship = championships.find(c => c.id === match.campeonatoId);
        if (!championship) {
            toast({ title: "Erro", description: "Não foi possível encontrar dados do campeonato.", variant: "destructive" });
            setLoadingAi(prev => ({ ...prev, [match.id]: false }));
            return;
        }

        const predictionsForMatch = allPredictions.filter(p => p.matchId === match.id && p.userId !== user.id);

        if (predictionsForMatch.length < 3) {
             toast({
                title: "Dados Insuficientes",
                description: "Ainda não há palpites suficientes de outros jogadores para gerar uma sugestão da IA.",
                variant: "destructive",
            });
            setLoadingAi(prev => ({ ...prev, [match.id]: false }));
            return;
        }

        // Construir os dados para a IA
        const predictionDataForAPI = predictionsForMatch.map(p => {
            const predictor = allUsers.find(u => u.id === p.userId);
            return {
                userNickname: predictor?.apelido || 'Anônimo',
                prediction: `${p.palpiteUsuario.placarA}-${p.palpiteUsuario.placarB}`,
            };
        });

        // Simular ranking para o exemplo
        const sortedUsers = [...allUsers].sort((a,b) => (b.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0) - (a.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0));
        const userRank = sortedUsers.findIndex(u => u.id === user.id) + 1;

        const res = await getAiSuggestion({
            userNickname: user.apelido,
            userPosition: userRank,
            totalParticipants: championship.participantes.length,
            predictionData: predictionDataForAPI,
        });

        if (res.error || !res.suggestion) {
             toast({
                title: "Erro na IA",
                description: res.error || "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        } else {
            setAiModalState({ open: true, suggestion: res.suggestion, justification: res.justification, match: match });
        }

        setLoadingAi(prev => ({ ...prev, [match.id]: false }));
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

    const groupedMatches = useMemo(() => {
        return displayedMatches.reduce((acc, match) => {
            const phase = match.fase || 'Próximas Partidas';
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(match);
            return acc;
        }, {} as Record<string, Match[]>);
    }, [displayedMatches]);


    if (authLoading || loadingData) {
        return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-24 bg-muted rounded-md animate-pulse"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    }

    if (Object.keys(groupedMatches).length === 0) {
        return (
             <Card className="m-4 sm:m-6 lg:p-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                         <CalendarCheck className="h-6 w-6 text-primary" />
                        Palpites
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-10 text-center">
                     <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                        <Goal className="w-12 h-12 text-muted-foreground" />
                    </div>
                     <p className="text-lg font-semibold">Tudo em dia!</p>
                     <p className="text-muted-foreground mt-2">
                        Não há partidas abertas para palpites nos campeonatos em que você participa.
                        <br/>
                        Volte mais tarde ou verifique o dashboard.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex items-center gap-4">
                 <CalendarCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Meus Palpites</h1>
                    <p className="text-muted-foreground">
                        Registre ou altere seus palpites para as próximas partidas.
                    </p>
                </div>
            </div>

            <ChampionPrediction championships={championships} teams={allTeams} user={user} />
            
            <TooltipProvider>
                <div className="space-y-8">
                    {Object.entries(groupedMatches).map(([phase, matches]) => (
                        <div key={phase} className="space-y-4">
                            <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
                            {matches.map((match) => {
                                const userPrediction = userPredictions.find(p => p.matchId === match.id);
                                const isEditing = !!userPrediction;
                                const currentScore = scores[match.id] || { placarA: userPrediction?.palpiteUsuario.placarA ?? null, placarB: userPrediction?.palpiteUsuario.placarB ?? null };
                                const needsAttention = differenceInHours(parseISO(match.data), new Date()) < 2 && !isEditing;
                                const teamA = allTeams.find(t => t.name === match.timeA);
                                const teamB = allTeams.find(t => t.name === match.timeB);
                                const isLocked = match.predictionsLocked || isPast(parseISO(match.data));
                                const championship = championships.find(c => c.id === match.campeonatoId);
                                const allowAiAssist = championship?.predictionAssist?.active ?? false;
                                
                                return (
                                    <Card 
                                        key={match.id} 
                                        id={match.id} 
                                        ref={(el) => matchRefs.current[match.id] = el}
                                        className={cn("relative overflow-hidden scroll-mt-20", needsAttention && !isLocked && "border-accent animate-pulse", isLocked && "bg-muted/30")}
                                    >
                                        {needsAttention && !isLocked && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="absolute top-2 left-2 z-10">
                                                        <AlertCircle className="h-5 w-5 text-accent animate-pulse" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right">
                                                    <p>Palpite necessário! Esta partida começa em breve.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        <CardHeader className='pb-2 pt-4 text-center'>
                                            <CardTitle className="text-base font-semibold flex items-center justify-center gap-2">
                                                {match.campeonato}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground">
                                                <UpcomingMatchDate matchDateString={match.data} />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-around w-full gap-2">
                                                <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                    <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={`Bandeira ${match.timeA}`} width={40} height={40} className="object-contain" data-ai-hint="team logo" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{match.timeA}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>

                                                <div className="flex items-center justify-center gap-2">
                                                    {isLocked ? (
                                                        <div className="flex items-center justify-center w-44 h-12 text-center text-2xl font-bold bg-muted/50 rounded-md">
                                                            {currentScore.placarA !== null ? (
                                                                <span>{currentScore.placarA} - {currentScore.placarB}</span>
                                                            ) : (
                                                                <Lock className="h-6 w-6 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <NumberInput value={currentScore.placarA} onChange={(v) => handleScoreChange(match.id, 'placarA', v)} />
                                                            <span className="font-bold text-muted-foreground text-lg">x</span>
                                                            <NumberInput value={currentScore.placarB} onChange={(v) => handleScoreChange(match.id, 'placarB', v)} />
                                                        </>
                                                    )}
                                                </div>
                                                
                                                <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={`Bandeira ${match.timeB}`} width={40} height={40} className="object-contain" data-ai-hint="team logo" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{match.timeB}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-2 p-4">
                                            <div className='text-center h-4 mb-2'>
                                                {isLocked ? (
                                                    <Badge variant="destructive">Palpites Encerrados</Badge>
                                                ) : lastUpdated[match.id] && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {`Alterado em ${format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss")}`}
                                                    </p>
                                                )}
                                            </div>
                                            {!isLocked && (
                                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                                    {allowAiAssist && (
                                                        <Button 
                                                            variant="outline" 
                                                            onClick={() => handleAiSuggestion(match)} 
                                                            disabled={loadingAi[match.id]}
                                                            className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary"
                                                        >
                                                            {loadingAi[match.id] ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <BrainCircuit className="mr-2 h-4 w-4" />
                                                            )}
                                                            Consultar IA
                                                        </Button>
                                                    )}
                                                    <Button onClick={() => handlePredictionSubmit(match)} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={currentScore.placarA === null || currentScore.placarB === null}>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {isEditing ? 'Alterar Palpite' : 'Salvar Palpite'}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <Dialog open={aiModalState.open} onOpenChange={(isOpen) => setAiModalState(prev => ({...prev, open: isOpen}))}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wand2 className="h-5 w-5 text-primary" />
                                Sugestão Estratégica da IA
                            </DialogTitle>
                            {aiModalState.match && (
                                <DialogDescription>
                                    Confronto: <strong>{aiModalState.match.timeA} vs {aiModalState.match.timeB}</strong>
                                </DialogDescription>
                            )}
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="text-center bg-muted p-4 rounded-md">
                                <p className="font-semibold text-lg">{aiModalState.suggestion}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">{aiModalState.justification}</p>
                        </div>
                    </DialogContent>
                </Dialog>

            </TooltipProvider>
        </div>
    );
}

    