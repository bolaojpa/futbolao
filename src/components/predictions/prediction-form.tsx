
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockMatches, mockUser, mockPredictions } from '@/lib/data';
import { format, parseISO, differenceInHours, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, Loader2, Wand2, Save, ChevronUp, ChevronDown, AlarmClock, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestion } from '@/app/dashboard/predictions/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Countdown } from '@/components/shared/countdown';

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
                placeholder="_"
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


export function PredictionForm() {
    const { toast } = useToast();
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [scores, setScores] = useState<Record<string, { placarA: number | null; placarB: number | null }>>({});
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const initialUpdates: Record<string, Date | null> = {};
        const initialScores: Record<string, { placarA: number | null; placarB: number | null }> = {};

        mockPredictions.forEach(p => {
            if (p.userId === mockUser.id && mockMatches.upcoming.some(m => m.id === p.matchId && m.status === 'Agendado')) {
                 initialUpdates[p.matchId] = new Date(); 
                 initialScores[p.matchId] = { placarA: p.palpiteUsuario.placarA, placarB: p.palpiteUsuario.placarB };
            }
        });
        setLastUpdated(initialUpdates);
        setScores(initialScores);
    }, []);

    const handleScoreChange = (matchId: string, team: 'placarA' | 'placarB', value: number) => {
        setScores(prev => ({
            ...prev,
            [matchId]: {
                ...(prev[matchId] || { placarA: null, placarB: null }),
                [team]: value,
            },
        }));
    };

    const handlePredictionSubmit = (matchId: string) => {
        const isEditing = !!lastUpdated[matchId];
        
        toast({
            title: `Palpite ${isEditing ? 'Alterado' : 'Enviado'}!`,
            description: `Seu palpite foi ${isEditing ? 'atualizado' : 'registrado'} com sucesso. Boa sorte!`,
            variant: "default",
        });

        setLastUpdated(prev => ({ ...prev, [matchId]: new Date() }));
    };

    const handleAiSuggestion = async (matchId: string) => {
        setLoadingAi(prev => ({ ...prev, [matchId]: true }));
        
        const mockPredictionsForAI = [
            { userId: 'user_2', prediction: 'Time A vence por 2 a 1.' },
            { userId: 'user_3', prediction: 'Empate em 1 a 1.' },
            { userId: 'user_4', prediction: 'Acho que o Time A ganha de 1 a 0.' },
            { userId: 'user_5', prediction: '2 a 0 para o Time A.' },
            { userId: 'user_6', prediction: 'Time B surpreende e vence por 1 a 0.' },
        ];
        
        if (mockPredictionsForAI.length < 5) {
             toast({
                title: "Dados Insuficientes",
                description: "Ainda não há palpites suficientes para gerar uma sugestão da IA.",
                variant: "destructive",
            });
            setLoadingAi(prev => ({ ...prev, [matchId]: false }));
            return;
        }

        const res = await getAiSuggestion({
            matchId: matchId,
            predictionData: mockPredictionsForAI,
        });

        if (res.error || !res.suggestion) {
             toast({
                title: "Erro na IA",
                description: res.error || "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        } else {
            setAiSuggestions(prev => ({ ...prev, [matchId]: res.suggestion! }));
        }

        setLoadingAi(prev => ({ ...prev, [matchId]: false }));
    };
    
    const openMatches = mockMatches.upcoming.filter(match => match.status === 'Agendado');

    const UpcomingMatchDate = ({ matchDateString }: { matchDateString: string }) => {
        if (!isClient) {
          return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>Carregando...</div>;
        }
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

    if (!isClient) {
        return <div className="space-y-6">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader>
                        <CardTitle>Carregando Partidas...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-24 bg-muted rounded-md animate-pulse"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    }

    if (openMatches.length === 0) {
        return (
             <Alert>
                <AlertTitle>Nenhuma partida aberta!</AlertTitle>
                <AlertDescription>
                    Não há partidas abertas para palpites no momento. Volte mais tarde!
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {openMatches.map((match) => {
                    const isEditing = !!lastUpdated[match.id];
                    const currentScore = scores[match.id] || { placarA: null, placarB: null };
                    const needsAttention = isClient && differenceInHours(parseISO(match.data), new Date()) < 2 && !isEditing;

                    return (
                        <Card key={match.id} className={cn("relative overflow-hidden", needsAttention && "border-accent animate-pulse")}>
                            {needsAttention && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute top-2 left-2 z-10">
                                            <AlertCircle className="h-5 w-5 text-accent animate-pulse" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Palpite necessário! Esta partida começa em breve.</p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                             <CardHeader className='items-center text-center'>
                                <CardTitle className="w-full">
                                    <div className="flex justify-center items-center gap-4 text-xl md:text-2xl">
                                        <span className="font-bold text-right flex-1 hidden md:block">{match.timeA}</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{match.timeA}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <span className="text-muted-foreground font-normal">-</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{match.timeB}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                        <span className="font-bold text-left flex-1 hidden md:block">{match.timeB}</span>
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    {match.campeonato}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center gap-4">
                                    <NumberInput value={currentScore.placarA} onChange={(v) => handleScoreChange(match.id, 'placarA', v)} />
                                    <span className="font-bold text-muted-foreground">x</span>
                                    <NumberInput value={currentScore.placarB} onChange={(v) => handleScoreChange(match.id, 'placarB', v)} />
                                </div>
                                {aiSuggestions[match.id] && (
                                    <Alert className="mt-4 bg-primary/10 border-primary/20">
                                        <Wand2 className="h-4 w-4 text-primary" />
                                        <AlertTitle className="font-headline text-primary">Sugestão da IA</AlertTitle>
                                        <AlertDescription>
                                            {aiSuggestions[match.id]}
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                             <CardFooter className="flex-col gap-4">
                                <div className='w-full py-2 rounded-md'>
                                    <UpcomingMatchDate matchDateString={match.data} />
                                </div>
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                                    <div>
                                        {lastUpdated[match.id] && (
                                            <p className="text-xs text-muted-foreground">
                                                {isEditing ? 'Alterado' : 'Salvo'} em {format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss")}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleAiSuggestion(match.id)} 
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
                                        <Button onClick={() => handlePredictionSubmit(match.id)} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={currentScore.placarA === null || currentScore.placarB === null}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isEditing ? 'Alterar Palpite' : 'Salvar Palpite'}
                                        </Button>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
