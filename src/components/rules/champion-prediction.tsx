
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockChampionships, mockTeams, mockUser } from '@/lib/data';
import { isFuture, parseISO } from 'date-fns';
import { Trophy, Save, Info, CheckCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function ChampionPrediction() {
    const { toast } = useToast();
    
    // Filtra campeonatos que aceitam palpites E (ainda não começaram OU o usuário já tem palpite)
    const availableChampionships = useMemo(() => {
        return mockChampionships.filter(champ => {
            const hasPrediction = mockUser.championPicks?.some(p => p.championshipId === champ.id);
            const isPredictionActive = champ.championPredictionSettings?.active;
            if (!isPredictionActive) return false;

            const startDate = typeof champ.dataInicio === 'string' ? champ.dataInicio : champ.dataInicio.toISOString();
            
            return isFuture(parseISO(startDate)) || hasPrediction;
        });
    }, []);

    const [predictions, setPredictions] = useState<Record<string, string[]>>({});
    const [savedPicks, setSavedPicks] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        if (mockUser.championPicks) {
            for (const pick of mockUser.championPicks) {
                initialState[pick.championshipId] = true;
                setPredictions(prev => ({
                    ...prev,
                    [pick.championshipId]: pick.teams
                }));
            }
        }
        return initialState;
    });

    const handlePredictionChange = (championshipId: string, index: number, value: string) => {
        setPredictions(prev => {
            const currentPicks = prev[championshipId] ? [...prev[championshipId]] : [];
            currentPicks[index] = value;
            return {
                ...prev,
                [championshipId]: currentPicks
            };
        });
        setSavedPicks(prev => ({...prev, [championshipId]: false}));
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
                    <TooltipProvider>
                        {availableChampionships.map(champ => {
                            const startDate = typeof champ.dataInicio === 'string' ? champ.dataInicio : champ.dataInicio.toISOString();
                            const isPredictionOpen = isFuture(parseISO(startDate));
                             const numberOfPicks = champ.championPredictionSettings?.numberOfPicks || 1;
                             const picksArray = Array.from({ length: numberOfPicks });
                             const arePicksMade = predictions[champ.id]?.every(p => p && p.length > 0) && predictions[champ.id]?.length === numberOfPicks;
                             const userPicks = predictions[champ.id] || [];

                            return (
                                <AccordionItem value={champ.id} key={champ.id} disabled={!isPredictionOpen}>
                                    <AccordionTrigger>
                                         <div className="flex items-center gap-3 flex-1">
                                            {champ.iconUrl && (
                                                <Image src={champ.iconUrl} alt={champ.nome} width={24} height={24} />
                                            )}
                                            <span className="font-semibold">{champ.nome}</span>
                                        </div>
                                         {!isPredictionOpen && userPicks.length > 0 ? (
                                            <div className="flex items-center gap-2 mr-4">
                                                 {userPicks.map((pickName, index) => {
                                                    const team = mockTeams.find(t => t.name === pickName);
                                                    return (
                                                         <Tooltip key={index}>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1">
                                                                     <span className="text-xs font-bold">{index + 1}º</span>
                                                                    {team && <Image src={team.crestUrl} alt={team.name} width={20} height={20} className="rounded-full" />}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{pickName}</p></TooltipContent>
                                                        </Tooltip>
                                                    );
                                                 })}
                                            </div>
                                         ) : (
                                            <Badge variant="secondary" className="mr-4">{numberOfPicks} {numberOfPicks > 1 ? 'Escolhas' : 'Escolha'}</Badge>
                                         )}
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
                                                {savedPicks[champ.id] ? 'Alterar Palpites' : 'Salvar Palpites'} para {champ.nome}
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
                    </TooltipProvider>
                 </Accordion>
            </CardContent>
        </Card>
    );
}
