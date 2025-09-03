
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockChampionships, mockTeams } from '@/lib/data';
import { isFuture, parseISO } from 'date-fns';
import { Trophy, Save, Info, CheckCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function ChampionPrediction() {
    const { toast } = useToast();
    
    const availableChampionships = useMemo(() => {
        return mockChampionships.filter(champ => {
            let startDate;
            if (typeof champ.dataInicio === 'string') {
                startDate = champ.dataInicio;
            } else if (champ.dataInicio instanceof Date) {
                startDate = champ.dataInicio.toISOString();
            } else {
                return false;
            }
            return champ.championPredictionSettings?.active && isFuture(parseISO(startDate));
        });
    }, []);

    const [predictions, setPredictions] = useState<Record<string, string[]>>({});
    const [savedPicks, setSavedPicks] = useState<Record<string, boolean>>({});

    const handlePredictionChange = (championshipId: string, index: number, value: string) => {
        setPredictions(prev => {
            const currentPicks = prev[championshipId] ? [...prev[championshipId]] : [];
            currentPicks[index] = value;
            return {
                ...prev,
                [championshipId]: currentPicks
            };
        });
    };

    const getTeamOptions = (championshipId: string, currentIndex: number) => {
        const championship = mockChampionships.find(c => c.id === championshipId);
        if (!championship || !championship.teamIds) return [];
        
        const participatingTeams = championship.teamIds
            .map(id => mockTeams.find(team => team.id === id))
            .filter(Boolean as (value: any) => value is NonNullable<any>);
            
        const selectedValues = (predictions[championshipId] || []).filter((_, index) => index !== currentIndex);
        
        return participatingTeams
            .filter(team => !selectedValues.includes(team!.name))
            .map(team => ({ label: team!.name, value: team!.name }));
    };

    const handleSave = (championshipId: string, championshipName: string) => {
        console.log(`Salvando palpites para ${championshipName}:`, predictions[championshipId]);
        toast({
            title: "Palpites Salvos!",
            description: `Seus palpites de campeão para "${championshipName}" foram salvos com sucesso.`,
        });
        setSavedPicks(prev => ({...prev, [championshipId]: true}));
    };

    if (availableChampionships.length === 0) {
        return null; 
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                     <Trophy className="h-6 w-6 text-amber-500" />
                    <div>
                        <CardTitle>Palpites de Campeão</CardTitle>
                        <CardDescription>
                            Faça suas apostas de longo prazo. Os palpites serão bloqueados após o início do campeonato.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {availableChampionships.map(champ => {
                         const numberOfPicks = champ.championPredictionSettings?.numberOfPicks || 1;
                         const picksArray = Array.from({ length: numberOfPicks });
                         const arePicksMade = predictions[champ.id]?.every(p => p && p.length > 0) && predictions[champ.id]?.length === numberOfPicks;

                        return (
                            <AccordionItem value={champ.id} key={champ.id}>
                                <AccordionTrigger>
                                     <div className="flex items-center gap-3 flex-1">
                                        {champ.iconUrl && (
                                            <Image src={champ.iconUrl} alt={champ.nome} width={24} height={24} />
                                        )}
                                        <span className="font-semibold">{champ.nome}</span>
                                    </div>
                                    <Badge variant="secondary" className="mr-4">{numberOfPicks} {numberOfPicks > 1 ? 'Escolhas' : 'Escolha'}</Badge>
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 space-y-4">
                                     {picksArray.map((_, index) => (
                                        <div key={index} className="space-y-2">
                                            <Label htmlFor={`prediction-${champ.id}-${index}`}>{index + 1}º Lugar</Label>
                                            <Combobox
                                                options={getTeamOptions(champ.id, index)}
                                                value={(predictions[champ.id] && predictions[champ.id][index]) || ''}
                                                onChange={(value) => handlePredictionChange(champ.id, index, value)}
                                                placeholder="Selecione a equipe..."
                                                searchPlaceholder="Buscar equipe..."
                                                notFoundMessage="Nenhuma equipe encontrada."
                                            />
                                        </div>
                                    ))}
                                     <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                                        <Info className="w-4 h-4 shrink-0" />
                                        <p>Você pode alterar seus palpites a qualquer momento antes do início da primeira partida do campeonato.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                                        <Button onClick={() => handleSave(champ.id, champ.nome)} disabled={!arePicksMade}>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Palpites para {champ.nome}
                                        </Button>
                                        {savedPicks[champ.id] && (
                                            <div className="flex items-center gap-2 text-sm text-green-600 animate-in fade-in">
                                                <CheckCircle className="h-4 w-4" />
                                                <p>Seus palpites para este campeonato foram salvos!</p>
                                            </div>
                                        )}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                 </Accordion>
            </CardContent>
        </Card>
    );
}
