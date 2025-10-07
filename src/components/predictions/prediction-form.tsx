

"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, differenceInHours, isToday, isPast, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, Loader2, Save, ChevronUp, ChevronDown, AlarmClock, Calendar, AlertCircle, Lock, Gem, Check, X, Goal, Ghost } from 'lucide-react';
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
import Link from 'next/link';

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
        <div className="relative w-16">
            <Input
                type="text"
                readOnly
                value={value === null ? '' : value}
                className="w-full h-11 text-center text-xl font-bold bg-muted border-0 pr-6 disabled:opacity-75"
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
    allUsers: UserType[];
    selectedChampionshipId: string | 'all';
}


export function PredictionForm({ championships, allTeams, allMatches, allUsers, selectedChampionshipId }: PredictionFormProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
    const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [scores, setScores] = useState<Record<string, { placarA: number | null; placarB: number | null }>>({});
    const [comboUiState, setComboUiState] = useState<Record<string, { totalGols: number | null; isEditing: boolean }>>({});
    
    const [aiSuggestion, setAiSuggestion] = useState<{ matchId: string; suggestion: string; justification: string; } | null>(null);

    const matchRefs = useRef<Record<string, HTMLElement | null>>({});
    const processingGhostPrediction = useRef(new Set<string>());

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

    // Lógica para o Fantasma fazer o palpite
    useEffect(() => {
        const ghostUser = allUsers.find(u => u.isGhost);
        if (!ghostUser || displayedMatches.length === 0) return;

        const now = new Date();
        
        displayedMatches.forEach(match => {
            const matchDate = parseISO(match.data);
            const hoursUntilMatch = differenceInHours(matchDate, now);
            const hasGhostPredicted = allPredictions.some(p => p.matchId === match.id && p.userId === ghostUser.id);

            // Verifica se a partida está dentro da janela de 12 horas e se o fantasma ainda não palpitou.
            // A flag `processingGhostPrediction` evita múltiplas chamadas simultâneas para a mesma partida.
            if (hoursUntilMatch <= 12 && !hasGhostPredicted && !processingGhostPrediction.current.has(match.id)) {
                
                const makeGhostPrediction = async () => {
                    processingGhostPrediction.current.add(match.id); // Marca como processando

                    const championship = championships.find(c => c.id === match.campeonatoId);
                    if (!championship) {
                        processingGhostPrediction.current.delete(match.id);
                        return;
                    }
                    
                    const predictionsForMatch = allPredictions.filter(p => p.matchId === match.id && p.userId !== ghostUser.id);
                    const aggregatedPredictions = predictionsForMatch.reduce((acc, p) => {
                        const predictionKey = `${p.palpiteUsuario.placarA}-${p.palpiteUsuario.placarB}`;
                        if (!acc[predictionKey]) {
                            acc[predictionKey] = { prediction: predictionKey, count: 0 };
                        }
                        acc[predictionKey].count++;
                        return acc;
                    }, {} as Record<string, { prediction: string; count: number }>);
                    
                    const predictionDataForAPI = Object.values(aggregatedPredictions);

                    const sortedUsers = [...allUsers].sort((a,b) => (b.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0) - (a.championshipStats?.find(s => s.championshipId === championship.id)?.pontos || 0));
                    const userRank = sortedUsers.findIndex(u => u.id === ghostUser.id) + 1;
                    
                    const totalMatchesInChampionship = allMatches.filter(m => m.campeonatoId === championship.id).length;
                    const userMatchesPlayed = allPredictions.filter(p => p.userId === ghostUser.id && allMatches.some(m => m.id === p.matchId && m.campeonatoId === championship.id)).length;
                    
                    try {
                        const result = await getAiSuggestion({
                            userNickname: ghostUser.apelido,
                            userPosition: userRank,
                            totalParticipants: championship.participantes.length,
                            predictionData: predictionDataForAPI,
                            currentUserMatches: userMatchesPlayed,
                            totalUserMatches: totalMatchesInChampionship
                        });
                        
                        if ('suggestedPrediction' in result) {
                            const [placarA, placarB] = result.suggestedPrediction.split('-').map(Number);
                            await savePrediction({
                                matchId: match.id,
                                userId: ghostUser.id,
                                palpiteUsuario: { placarA, placarB },
                            }, {id: ghostUser.id, apelido: ghostUser.apelido, funcao: ghostUser.funcao });
                        }
                    } catch (error) {
                        console.error(`AI prediction failed for ghost user on match ${match.id}:`, error);
                    } finally {
                        processingGhostPrediction.current.delete(match.id); // Remove a marcação
                    }
                };

                makeGhostPrediction();
            }
        });

    }, [displayedMatches, allUsers, allPredictions, allMatches, championships]);


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

        await saveComboPick(user.id, matchId, comboState.totalGols, { id: user.id, apelido: user.apelido, funcao: user.funcao });
        setComboUiState(prev => ({
            ...prev,
            [matchId]: { ...prev[matchId], isEditing: false }
        }));
         toast({
            title: "Ficha Salva!",
            description: "Seu palpite de gols foi confirmado para esta partida.",
        });
    };

    const handleRemoveCombo = async (matchId: string) => {
        if (!user) return;
        await saveComboPick(user.id, matchId, null, { id: user.id, apelido: user.apelido, funcao: user.funcao }); // Salva como null para remover
        handleCancelCombo(matchId); // Remove do estado da UI
        toast({
            title: "Ficha Removida",
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
            }, { id: user.id, apelido: user.apelido, funcao: user.funcao });

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
    
    const ghostUser = allUsers.find(u => u.isGhost);

    return (
        <>
            <TooltipProvider>
                <div className="space-y-8">
                    {Object.entries(groupedMatches).map(([phase, matches]) => {
                        const championshipForPhase = championships.find(c => c.id === matches[0]?.campeonatoId);
                        const comboCota = championshipForPhase?.pontuacao.combo?.cotasPorFase?.find(c => c.fase === phase);
                        const tokensUsedInPhase = comboTokensUsedByPhase[phase] || 0;
                        const tokensRemaining = comboCota ? comboCota.quantidade - tokensUsedInPhase : 0;

                        return (
                        <div key={phase} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
                                {comboCota && comboCota.quantidade > 0 && (
                                    <Badge variant="secondary" className="flex items-center gap-2">
                                        <Gem className="h-4 w-4 text-primary" />
                                        <span>
                                             {tokensRemaining === 1 ? 'Ficha Restante' : 'Fichas Restantes'}: {tokensRemaining} / {comboCota.quantidade}
                                        </span>
                                    </Badge>
                                )}
                            </div>
                            {matches.map((match) => {
                                const score = scores[match.id] || { placarA: null, placarB: null };
                                const teamA = allTeams.find(t => t.name === match.timeA);
                                const teamB = allTeams.find(t => t.name === match.timeB);
                                const matchDate = parseISO(match.data);
                                const isLocked = isPast(matchDate) || match.predictionsLocked;
                                const showLockMessage = match.predictionsLocked && isFuture(matchDate);
                                const userHasPredicted = score.placarA !== null && score.placarB !== null;
                                const isComboActiveForChamp = championshipForPhase?.pontuacao.combo?.ativo;
                                const comboState = comboUiState[match.id];
                                const hasUsedCombo = comboState !== undefined && !comboState.isEditing;
                                
                                return (
                                    <Card key={match.id} id={match.id} ref={(el) => matchRefs.current[match.id] = el}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                                     {match.iconUrl && <Image src={match.iconUrl} alt="" width={16} height={16} />}
                                                    <span>{match.campeonato}</span>
                                                </div>
                                                 <UpcomingMatchDate matchDateString={match.data} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center gap-4">
                                            <div className="flex items-center justify-center w-full">
                                                <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                                    <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                                    <div className='flex h-14 w-14 items-center justify-center'>
                                                        <Image src={teamA?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeA} width={56} height={56} className="object-contain h-full w-auto" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center font-bold text-2xl whitespace-nowrap mx-2">
                                                   <NumberInput value={score.placarA} onChange={(val) => handleScoreChange(match.id, 'placarA', val)} disabled={isLocked} />
                                                    <span className="mx-2 text-muted-foreground">-</span>
                                                    <NumberInput value={score.placarB} onChange={(val) => handleScoreChange(match.id, 'placarB', val)} disabled={isLocked} />
                                                </div>
                                                <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                                    <div className='flex h-14 w-14 items-center justify-center'>
                                                         <Image src={teamB?.crestUrl || "https://picsum.photos/128/128"} alt={match.timeB} width={56} height={56} className="object-contain h-full w-auto" />
                                                    </div>
                                                    <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                                                </div>
                                            </div>
                                            {showLockMessage && (
                                                <Badge variant="warning" className="animate-pulse">
                                                    <Lock className="mr-2 h-3 w-3" />
                                                    Palpites para esta partida foram bloqueados pelo administrador.
                                                </Badge>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex flex-col gap-4">
                                            <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
                                                <div className="flex-1 flex gap-2">
                                                    <Button onClick={() => handlePredictionSubmit(match)} className="w-full sm:w-auto" disabled={isLocked || !userHasPredicted}>
                                                        {loadingAi[match.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                                        {userPredictions.some(p => p.matchId === match.id) ? 'Alterar Palpite' : 'Salvar Palpite'}
                                                    </Button>
                                                     {championshipForPhase?.predictionAssist?.active && (
                                                        <Button onClick={() => handleAiSuggestion(match)} variant="outline" className="w-full sm:w-auto" disabled={isLocked}>
                                                             {loadingAi[match.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                            Consultar IA
                                                        </Button>
                                                     )}
                                                </div>
                                                {isComboActiveForChamp && !isLocked && (
                                                    <div className="flex items-center gap-2">
                                                         {comboState?.isEditing ? (
                                                            <>
                                                                <div className="relative">
                                                                     <Goal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                                     <Input 
                                                                        type="number"
                                                                        placeholder="Gols" 
                                                                        className="w-28 pl-9"
                                                                        value={comboState.totalGols ?? ''}
                                                                        onChange={(e) => setComboUiState(prev => ({...prev, [match.id]: {...prev[match.id], totalGols: parseInt(e.target.value) || null}}))}
                                                                     />
                                                                </div>
                                                                 <Button size="icon" onClick={() => handleConfirmCombo(match.id)}><Check className="h-4 w-4"/></Button>
                                                                 <Button size="icon" variant="destructive" onClick={() => handleCancelCombo(match.id)}><X className="h-4 w-4"/></Button>
                                                            </>
                                                         ) : hasUsedCombo ? (
                                                             <div className="flex items-center gap-2">
                                                                <Badge variant="success" className="gap-2">
                                                                    <Gem className="h-3 w-3"/> Ficha usada: {comboState.totalGols} gols
                                                                </Badge>
                                                                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCombo(match.id)}>
                                                                    <X className="h-4 w-4 text-destructive"/>
                                                                </Button>
                                                            </div>
                                                         ) : (
                                                            <Button 
                                                                variant="outline" 
                                                                className="w-full sm:w-auto text-primary border-primary/50 hover:bg-primary/10 hover:text-primary"
                                                                onClick={() => handleUseComboToken(match.id)}
                                                                disabled={tokensRemaining <= 0}
                                                            >
                                                                <Gem className="mr-2 h-4 w-4"/> Usar Ficha de Combo
                                                            </Button>
                                                         )}
                                                    </div>
                                                )}
                                            </div>
                                            {lastUpdated[match.id] && (
                                                <p className="text-xs text-muted-foreground w-full text-right">
                                                    Última alteração: {format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss", { locale: ptBR })}
                                                </p>
                                            )}
                                        </CardFooter>
                                    </Card>
                                )
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
