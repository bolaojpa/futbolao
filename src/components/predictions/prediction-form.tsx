"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockMatches, otherUsersPredictionsForAI } from '@/lib/data';
import { differenceInHours, format } from 'date-fns';
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

    const handlePredictionSubmit = (matchId: string) => {
        toast({
            title: "Palpite Enviado!",
            description: "Seu palpite foi registrado com sucesso. Boa sorte!",
            variant: "default",
        });
    };

    const handleAiSuggestion = async (matchId: string) => {
        setLoadingAi(prev => ({ ...prev, [matchId]: true }));
        
        if (otherUsersPredictionsForAI.length < 5) {
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
            predictionData: otherUsersPredictionsForAI,
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

    return (
        <div className="space-y-6">
            {mockMatches.upcoming.map((match) => {
                const matchDate = new Date(match.data);
                const isLocked = differenceInHours(matchDate, new Date()) < 2;

                return (
                    <Card key={match.id} className={isLocked ? 'opacity-70' : ''}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{match.timeA} vs {match.timeB}</span>
                                {isLocked && <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" /> Encerrado</Badge>}
                            </CardTitle>
                            <CardDescription>
                                {format(matchDate, "eeee, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <Input type="number" min="0" placeholder="0" className="text-center w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" disabled={isLocked} />
                                <span className="text-muted-foreground">x</span>
                                <Input type="number" min="0" placeholder="0" className="text-center w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" disabled={isLocked} />
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
                                disabled={isLocked || loadingAi[match.id]}
                                className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary"
                             >
                                {loadingAi[match.id] ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                )}
                                Consultar IA
                            </Button>
                            <Button onClick={() => handlePredictionSubmit(match.id)} disabled={isLocked} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                Salvar Palpite
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
