

"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockMatches, mockUser, mockPredictions } from '@/lib/data';
import { format, parseISO, differenceInHours, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BrainCircuit, Loader2, Wand2, Save, ChevronUp, ChevronDown, AlarmClock, Calendar, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestion } from '@/app/dashboard/predictions/actions';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Countdown } from '@/components/shared/countdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

type Match = typeof mockMatches.upcoming[0];

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


export function PredictionForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [aiModalState, setAiModalState] = useState<{ open: boolean; suggestion: string | null; match: Match | null }>({ open: false, suggestion: null, match: null });
    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [lastUpdated, setLastUpdated] = useState<Record<string, Date | null>>({});
    const [scores, setScores] = useState<Record<string, { placarA: number | null; placarB: number | null }>>({});
    const [isClient, setIsClient] = useState(false);
    
    // Estado para controlar as partidas visíveis
    const initialOpenMatches = mockMatches.upcoming.filter(match => match.status === 'Agendado' && !isPast(parseISO(match.data)));
    const [displayedMatches, setDisplayedMatches] = useState<Match[]>(initialOpenMatches);
    
    // Armazena as referências dos cards para a rolagem
    const matchRefs = useRef<Record<string, HTMLElement | null>>({});


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

        // Lógica para rolar para o card do jogo
        if (window.location.hash) {
            const matchId = window.location.hash.substring(1);
            setTimeout(() => { // Timeout para garantir que o elemento esteja renderizado
                const element = matchRefs.current[matchId];
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }

        // Lógica para remover cards de jogos que já começaram
        const interval = setInterval(() => {
            setDisplayedMatches(prevMatches => 
                prevMatches.filter(match => !isPast(parseISO(match.data)))
            );
        }, 1000); // Verifica a cada segundo

        return () => clearInterval(interval); // Limpa o intervalo quando o componente desmonta

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

    const handlePredictionSubmit = (match: Match) => {
        // Simula a verificação do servidor
        if (isPast(parseISO(match.data))) {
            toast({
                title: "Tempo Esgotado!",
                description: "Esta partida já começou e não pode mais receber palpites.",
                variant: "destructive",
            });
            // Remove o card da UI e redireciona
            setDisplayedMatches(prev => prev.filter(m => m.id !== match.id));
            router.push('/dashboard');
            return;
        }

        const isEditing = !!lastUpdated[match.id];
        
        toast({
            title: `Palpite ${isEditing ? 'Alterado' : 'Enviado'}!`,
            description: `Seu palpite foi ${isEditing ? 'atualizado' : 'registrado'} com sucesso. Boa sorte!`,
            variant: "default",
        });

        setLastUpdated(prev => ({ ...prev, [match.id]: new Date() }));
    };

    const handleAiSuggestion = async (match: Match) => {
        setLoadingAi(prev => ({ ...prev, [match.id]: true }));
        
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
            setLoadingAi(prev => ({ ...prev, [match.id]: false }));
            return;
        }

        const res = await getAiSuggestion({
            matchId: match.id,
            predictionData: mockPredictionsForAI,
        });

        if (res.error || !res.suggestion) {
             toast({
                title: "Erro na IA",
                description: res.error || "Ocorreu um erro desconhecido.",
                variant: "destructive",
            });
        } else {
            setAiModalState({ open: true, suggestion: res.suggestion, match: match });
        }

        setLoadingAi(prev => ({ ...prev, [match.id]: false }));
    };
    
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

    if (displayedMatches.length === 0) {
        return (
             <Card>
                <CardContent className="p-6 text-center">
                     <p>Não há partidas abertas para palpites no momento. Volte mais tarde!</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {displayedMatches.map((match) => {
                    const isEditing = !!lastUpdated[match.id];
                    const currentScore = scores[match.id] || { placarA: null, placarB: null };
                    const needsAttention = isClient && differenceInHours(parseISO(match.data), new Date()) < 2 && !isEditing;

                    return (
                        <Card 
                            key={match.id} 
                            id={match.id} 
                            ref={(el) => matchRefs.current[match.id] = el}
                            className={cn("relative overflow-hidden scroll-mt-20", needsAttention && "border-accent animate-pulse")}
                        >
                            {needsAttention && (
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
                                <CardTitle className="text-base font-semibold">{match.campeonato}</CardTitle>
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
                                                <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{match.timeA}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                     </div>

                                    <div className="flex items-center justify-center gap-2">
                                        <NumberInput value={currentScore.placarA} onChange={(v) => handleScoreChange(match.id, 'placarA', v)} />
                                        <span className="font-bold text-muted-foreground text-lg">x</span>
                                        <NumberInput value={currentScore.placarB} onChange={(v) => handleScoreChange(match.id, 'placarB', v)} />
                                    </div>
                                    
                                     <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
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
                                    {lastUpdated[match.id] && (
                                        <p className="text-xs text-muted-foreground">
                                            {isEditing ? 'Alterado' : 'Salvo'} em {format(lastUpdated[match.id]!, "dd/MM/yy 'às' HH:mm:ss")}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                                    <Button onClick={() => handlePredictionSubmit(match)} className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={currentScore.placarA === null || currentScore.placarB === null}>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isEditing ? 'Alterar Palpite' : 'Salvar Palpite'}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <Dialog open={aiModalState.open} onOpenChange={(isOpen) => setAiModalState(prev => ({...prev, open: isOpen}))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                             <Wand2 className="h-5 w-5 text-primary" />
                             Sugestão da IA
                        </DialogTitle>
                         {aiModalState.match && (
                            <DialogDescription>
                                Confronto: <strong>{aiModalState.match.timeA} vs {aiModalState.match.timeB}</strong>
                            </DialogDescription>
                        )}
                    </DialogHeader>
                    <div className="py-4 font-semibold text-center text-lg">
                        <p className="text-sm text-muted-foreground mb-2">Com base na tendência de outros jogadores, esta é a sugestão para sua aposta. Use com sabedoria!</p>
                        <p className="text-primary">{aiModalState.suggestion}</p>
                    </div>
                </DialogContent>
            </Dialog>

        </TooltipProvider>
    );
}
