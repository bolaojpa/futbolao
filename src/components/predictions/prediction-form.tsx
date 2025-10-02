
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInHours, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, Loader2, Save, ChevronUp, ChevronDown, AlarmClock, Calendar, AlertCircle, Lock, Gem, Check, X, Goal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestion, savePrediction, saveComboPick } from '@/app/dashboard/predictions/actions';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Countdown } from '@/components/shared/countdown';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Match, Prediction, Team, Championship, UserType } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getDoc, onSnapshot, collection, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';

const NumberInput = ({ value, onChange, disabled }: { value: number | null; onChange: (value: number) => void; disabled?: boolean; }) => {
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
                className="w-full h-12 text-center text-2xl font-bold bg-muted border-0 pr-6 disabled:opacity-75"
                placeholder="-"
                disabled={disabled}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center h-full">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleIncrement} disabled={disabled}>
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleDecrement} disabled={disabled}>
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};


interface PredictionFormProps {
    championships: Championship[];
    allTeams: Team[];
    allMatches: Match[];
    selectedChampionshipId: string | 'all';
}


export function PredictionForm({ championships, allTeams, allMatches, selectedChampionshipId }: PredictionFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [scores, setScores] = useState<Record<string, { placarA: number | null; placarB: number | null }>>({});
    const [comboUiState, setComboUiState] = useState<Record<string, { totalGols: number | null; isEditing: boolean }>>({});
    
    // State for AI suggestion dialog
    const [aiSuggestion, setAiSuggestion] = useState<{ matchId: string; suggestion: string; justification: string; } | null>(null);

    const matchRefs = useRef<Record<string, HTMLElement | null>>({});

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); 
        return () => clearInterval(timer);
    }, []);

    const activeChampionshipsForUser = useMemo(() => {
        if (!user) return [];
        return championships.filter(c => c.status === 'ativo' && c.participantes.includes(user.id));
    }, [championships, user]);

    const displayedMatches = useMemo(() => {
        if (activeChampionshipsForUser.length === 0) return [];
        const champIds = selectedChampionshipId === 'all' 
            ? activeChampionshipsForUser.map(c => c.id)
            : [selectedChampionshipId];
        
        return allMatches
            .filter(match => {
                if (match.status !== 'Agendado') return false;
                if (!champIds.includes(match.campeonatoId)) return false;
                return !isPast(parseISO(match.data));
            })
            .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [allMatches, activeChampionshipsForUser, currentTime, selectedChampionshipId]);


    useEffect(() => {
        if (!user) return;
        
        const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
            const allPreds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
            setAllPredictions(allPreds);

            const predictionsData = allPreds.filter(p => p.userId === user.id);
            setUserPredictions(predictionsData);

            const initialScores: Record<string, { placarA: number | null; placarB: number | null }> = {};
            const initialComboState: Record<string, { totalGols: number | null, isEditing: boolean }> = {};
            const initialUpdates: Record<string, Date | null> = {};

            predictionsData.forEach(p => {
                initialScores[p.matchId] = { placarA: p.palpiteUsuario.placarA, placarB: p.palpiteUsuario.placarB };
                if (p.palpiteCombo) {
                    initialComboState[p.matchId] = { totalGols: p.palpiteCombo.totalGols, isEditing: false };
                }
                if (p.updatedAt) {
                    initialUpdates[p.matchId] = p.updatedAt.toDate();
                }
            });

            setScores(prev => ({ ...prev, ...initialScores }));
            setComboUiState(prev => ({...prev, ...initialComboState}));
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
            unsubPredictions();
        };

    }, [user]);

    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: null, placarB: null }),
                [team]: value,
            },
        }));
    };
    
    const comboTokensUsedByPhase = useMemo(() => {
        const usage: Record<string, number> = {};
         userPredictions.forEach(p => {
            const match = allMatches.find(m => m.id === p.matchId);
            if (p.palpiteCombo && match && isFuture(parseISO(match.data))) {
                const phase = match.fase;
                if (!usage[phase]) {
                    usage[phase] = 0;
                }
                usage[phase]++;
            }
        });
        return usage;
    }, [userPredictions, allMatches]);

    const handleUseComboToken = (matchId: string) => {
        setComboUiState(prev => ({
            ...prev,
            [matchId]: { totalGols: null, isEditing: true }
        }));
    };

    const handleCancelCombo = (matchId: string) => {
         setComboUiState(prev => {
            const newState = { ...prev };
            delete newState[matchId];
            return newState;
        });
    }

    const handleConfirmCombo = async (matchId: string) => {
        if (!user) return;
        const comboState = comboUiState[matchId];
        if (comboState.totalGols === null || comboState.totalGols < 0) {
            toast({ title: "Valor Inválido", description: "Por favor, insira um número válido de gols.", variant: "destructive" });
            return;
        }

        await saveComboPick(user.id, matchId, comboState.totalGols);
        setComboUiState(prev => ({
            ...prev,
            [matchId]: { ...prev[matchId], isEditing: false }
        }));
         toast({
            title: "Ficha de Combo Salva!",
            description: "Seu palpite de gols foi confirmado para esta partida.",
        });
    };

    const handleRemoveCombo = async (matchId: string) => {
        if (!user) return;
        await saveComboPick(user.id, matchId, null); // Salva como null para remover
        handleCancelCombo(matchId); // Remove do estado da UI
        toast({
            title: "Ficha de Combo Removida",
            description: "Sua ficha está disponível para ser usada em outra partida.",
            variant: "destructive"
        });
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
            return;
        }

        const currentScore = scores[match.id];
        if (currentScore.placarA === null || currentScore.placarB === null) {
            toast({ title: "Palpite Incompleto", description: "Você precisa preencher o placar da partida.", variant: "destructive" });
            return;
        };
        
        const isEditing = !!userPredictions.find(p => p.matchId === match.id);

        try {
            await savePrediction({
                matchId: match.id,
                userId: user.id,
                palpiteUsuario: {
                    placarA: currentScore.placarA,
                    placarB: currentScore.placarB,
                },
            });

            toast({
                title: `Palpite ${isEditing ? 'Alterado' : 'Enviado'}!`,
                description: `Seu palpite foi ${isEditing ? 'atualizado' : 'registrado'} com sucesso. Boa sorte!`,
                variant: "default",
            });
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
        
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsersData = usersSnapshot.docs.map(doc => doc.data() as UserType);

        const aggregatedPredictions = predictionsForMatch.reduce((acc, p) => {
            const predictionKey = `${p.palpiteUsuario.placarA}-${p.palpiteUsuario.placarB}`;
            if (!acc[predictionKey]) {
                acc[predictionKey] = { prediction: predictionKey, count: 0 };
            }
            acc[predictionKey].count++;
            return acc;
        }, {} as Record<string, { prediction: string; count: number }>);

        const predictionDataForAPI = Object.values(aggregatedPredictions);

        const sortedUsers = [...allUsersData].sort((a,b) => (b.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0) - (a.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0));
        const userRank = sortedUsers.findIndex(u => u.id === user.id) + 1;
        
        const totalMatchesInChampionship = allMatches.filter(m => m.campeonatoId === championship.id).length;
        const userMatchesPlayed = userPredictions.filter(p => allMatches.some(m => m.id === p.matchId && m.campeonatoId === championship.id)).length;

        const res = await getAiSuggestion({
            userNickname: user.apelido,
            userPosition: userRank,
            totalParticipants: championship.participantes.length,
            predictionData: predictionDataForAPI,
            currentUserMatches: userMatchesPlayed,
            totalUserMatches: totalMatchesInChampionship
        });

        if ('error' in res || !res.suggestedPrediction) {
             toast({
                title: "Erro na IA",
                description: ('error' in res && res.error) || "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        } else {
            setAiSuggestion({
                matchId: match.id,
                suggestion: res.suggestedPrediction,
                justification: res.justification
            });
        }

        setLoadingAi(prev => ({ ...prev, [match.id]: false }));
    };
    
    const applyAiSuggestion = () => {
        if (!aiSuggestion) return;
        const { matchId, suggestion } = aiSuggestion;
        const [placarA, placarB] = suggestion.split('-').map(Number);
        handleScoreChange(matchId, 'placarA', placarA);
        handleScoreChange(matchId, 'placarB', placarB);
        setAiSuggestion(null);
        toast({
            title: "Sugestão Aplicada!",
            description: `O placar de ${suggestion} foi preenchido. Agora é só salvar.`,
        });
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


    if (Object.keys(groupedMatches).length === 0) {
        return null;
    }

    return (
        <>
            <TooltipProvider>
                <div className="space-y-8">
                    {Object.entries(groupedMatches).map(([phase, matches]) => {
                        const championshipForPhase = championships.find(c => c.id === matches[0]?.campeonatoId);
                        const comboCota = championshipForPhase?.pontuacao?.combo?.cotasPorFase?.find(c => c.fase === phase);
                        const tokensUsedInPhase = comboTokensUsedByPhase[phase] || 0;
                        const tokensRemaining = comboCota ? comboCota.quantidade - tokensUsedInPhase : 0;

                        return (
                        <div key={phase} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
                                {comboCota && comboCota.quantidade > 0 && (
                                    <Badge variant="secondary" className="flex items-center gap-2">
                                        <Gem className="h-4 w-4 text-primary" />
                                        <span>Fichas de Combo Restantes: {tokensRemaining} / {comboCota.quantidade}</span>
                                    </Badge>
                                )}
                            </div>
                            {matches.map((match) => {
                                const userPrediction = userPredictions.find(p => p.matchId === match.id);
                                const isEditingPrediction = !!userPrediction;
                                const currentScore = scores[match.id] || { placarA: null, placarB: null };
                                const comboState = comboUiState[match.id];

                                const originalScore = userPrediction?.palpiteUsuario;
                                const hasScoreChanged = isEditingPrediction ? 
                                    (currentScore.placarA !== originalScore?.placarA || currentScore.placarB !== originalScore?.placarB) :
                                    (currentScore.placarA !== null || currentScore.placarB !== null);
                                
                                const needsAttention = differenceInHours(parseISO(match.data), new Date()) < 2 && !isEditingPrediction;
                                const teamA = allTeams.find(t => t.name === match.timeA);
                                const teamB = allTeams.find(t => t.name === match.timeB);
                                const isLocked = match.predictionsLocked || isPast(parseISO(match.data));
                                const championship = championships.find(c => c.id === match.campeonatoId);
                                const allowAiAssist = championship?.predictionAssist?.active ?? false;
                                
                                const canUseCombo = (comboCota?.quantidade ?? 0) > 0 && (tokensRemaining > 0 || (!!comboState && !comboState.isEditing));
                                const isButtonDisabled = isLocked || 
                                    (isEditingPrediction && !hasScoreChanged) || 
                                    (!isEditingPrediction && (currentScore.placarA === null || currentScore.placarB === null));

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
                                                {championship?.iconUrl && <Image src={championship.iconUrl} alt="" width={16} height={16} />}
                                                {match.campeonato}
                                            </CardTitle>
                                            <div className="text-xs text-muted-foreground">
                                                <UpcomingMatchDate matchDateString={match.data} />
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col items-center gap-2">
                                                 <div className="flex items-center justify-around w-full gap-2 px-2">
                                                    <div className='flex-1 flex flex-row items-center justify-end gap-2 sm:gap-3'>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex h-14 w-14 items-center justify-center">
                                                                    <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt="" width={48} height={48} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{match.timeA}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="font-bold text-base text-center sm:text-right sm:text-lg hidden md:inline-block truncate">{match.timeA}</span>
                                                    </div>

                                                    <div className="flex items-center justify-center gap-2">
                                                        {isLocked ? (
                                                            <div className="flex items-center justify-center w-full min-w-44 h-12 text-center text-2xl font-bold bg-muted/50 rounded-md">
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
                                                    
                                                    <div className='flex-1 flex flex-row items-center justify-start gap-2 sm:gap-3'>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex h-14 w-14 items-center justify-center">
                                                                    <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt="" width={48} height={48} className="object-contain h-full w-auto" data-ai-hint="team logo" />
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{match.timeB}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                         <span className="font-bold text-base text-center sm:text-left sm:text-lg hidden md:inline-block truncate">{match.timeB}</span>
                                                    </div>
                                                </div>
                                                
                                                {comboState && !comboState.isEditing && !isLocked && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-1.5 font-semibold text-sm text-primary mt-2">
                                                                <Goal className="h-4 w-4" />
                                                                <span>Palpite de Gols: {comboState.totalGols}</span>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Seu palpite de gols para o combo.</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </CardContent>
                                        
                                        {comboState && comboState.isEditing && !isLocked && (
                                            <CardContent className="pt-2 pb-4">
                                                <Separator className="mb-4" />
                                                <div className="flex flex-col items-center gap-2">
                                                    <Label htmlFor={`combo-${match.id}`} className="font-semibold flex items-center gap-2 text-primary">
                                                        <Gem className="h-4 w-4" /> Palpite Combo: Total de Gols na Partida
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <NumberInput value={comboState.totalGols} onChange={(v) => setComboUiState(p => ({ ...p, [match.id]: { ...p[match.id], totalGols: v } }))} />
                                                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 h-9 w-9" onClick={() => handleConfirmCombo(match.id)}><Check className="h-5 w-5" /></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80 h-9 w-9" onClick={() => handleCancelCombo(match.id)}><X className="h-5 w-5" /></Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        )}
                                        
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
                                                    {canUseCombo && (
                                                        <>
                                                            {!comboState ? (
                                                                <Button 
                                                                    variant="outline"
                                                                    onClick={() => handleUseComboToken(match.id)}
                                                                >
                                                                    <Gem className="mr-2 h-4 w-4" />
                                                                    Usar Ficha Combo
                                                                </Button>
                                                            ) : (
                                                                !comboState.isEditing && (
                                                                    <Button variant="destructive" onClick={() => handleRemoveCombo(match.id)}>
                                                                        <X className="mr-2 h-4 w-4" />
                                                                        Remover Ficha
                                                                    </Button>
                                                                )
                                                            )}
                                                        </>
                                                    )}
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
                                                    <Button onClick={() => handlePredictionSubmit(match)} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isButtonDisabled}>
                                                        <Save className="mr-2 h-4 w-4" />
                                                        {isEditingPrediction ? 'Alterar Palpite' : 'Salvar Palpite'}
                                                    </Button>
                                                </div>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    )})}
                </div>
            </TooltipProvider>

            {aiSuggestion && (
                 <AlertDialog open={!!aiSuggestion} onOpenChange={() => setAiSuggestion(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <BrainCircuit className="h-6 w-6 text-primary" />
                                Análise da IA
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base text-left pt-4">
                                {aiSuggestion.justification}
                            </AlertDialogDescription>
                            <div className="pt-4 text-center">
                                <p className="text-sm text-muted-foreground">Placar Sugerido:</p>
                                <p className="text-2xl font-bold font-headline">{aiSuggestion.suggestion}</p>
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Fechar</AlertDialogCancel>
                            <AlertDialogAction onClick={applyAiSuggestion}>
                                Aplicar Sugestão
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}
