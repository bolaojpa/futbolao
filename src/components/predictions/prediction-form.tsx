"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockMatches } from '@/lib/data';
import { differenceInHours, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Lock, BrainCircuit, Loader2, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getAiSuggestion } from '@/app/dashboard/predictions/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function PredictionForm() {
    const { toast } = useToast();
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
    const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePredictionSubmit = (matchId: string) => {
        toast({
            title: "Palpite Enviado!",
            description: "Seu palpite foi registrado com sucesso. Boa sorte!",
            variant: "default",
        });
    };

    const handleAiSuggestion = async (matchId: string) => {
        setLoadingAi(prev => ({ ...prev, [matchId]: true }));
        
        // Mocking at least 5 predictions for demonstration
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

    const isMatchLocked = (matchDate: Date) => {
        if (!isClient) return true; // Default to locked on server
        return differenceInHours(matchDate, new Date()) < 2;
    }

    // Filter to show only matches that are still open for predictions
    const openMatches = mockMatches.upcoming.filter(match => {
        const matchDate = parseISO(match.data);
        return !isMatchLocked(matchDate) && match.status !== 'Finalizado' && match.status !== 'Cancelado' && match.status !== 'Ao Vivo';
    });

    if (!isClient) {
        // You can return a loading state or skeletons here
        return <div className="space-y-6">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader>
                        <CardTitle>Carregando Partidas...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
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
        <div className="space-y-6">
            {openMatches.map((match) => {
                const matchDate = parseISO(match.data);
                const isLocked = isMatchLocked(matchDate); // Should always be false here due to filter, but good for safety

                return (
                    <Card key={match.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{match.timeA} vs {match.timeB}</span>
                            </CardTitle>
                            <CardDescription>
                                {format(matchDate, "eeee, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Input type="number" min="0" placeholder="0" className="text-center w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                <span className="text-muted-foreground">x</span>
                                <Input type="number" min="0" placeholder="0" className="text-center w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
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
                        <CardFooter className="flex justify-end gap-2">
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
                            <Button onClick={() => handlePredictionSubmit(match.id)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                Salvar Palpite
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
