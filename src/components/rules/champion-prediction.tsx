
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isFuture, parseISO } from 'date-fns';
import { Trophy, Save, Info, CheckCircle } from 'lucide-react';
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
import { Separator } from '../ui/separator';
import type { Championship, Team, UserType } from '@/lib/types';
import { saveChampionPicks } from '@/app/dashboard/predictions/actions';

interface ChampionPredictionProps {
    championships: Championship[];
    teams: Team[];
    user: UserType | null;
}

export function ChampionPrediction({ championships, teams, user }: ChampionPredictionProps) {
    const { toast } = useToast();
    
    const { openForPrediction, lockedPredictions } = useMemo(() => {
        const open: Championship[] = [];
        const locked: Championship[] = [];
        if (!user) return { openForPrediction: [], lockedPredictions: [] };

        championships.forEach(champ => {
            const hasPrediction = user.championPicks?.some(p => p.championshipId === champ.id);
            if (!champ.championPredictionSettings?.active) return;
            
            const startDateString = typeof champ.dataInicio === 'string' ? champ.dataInicio : champ.dataInicio.toISOString();
            const isPredictionOpen = isFuture(parseISO(startDateString));

            if (isPredictionOpen) {
                open.push(champ);
            } else if (hasPrediction) {
                locked.push(champ);
            }
        });
        return { openForPrediction: open, lockedPredictions: locked };
    }, [championships, user]);

    const [predictions, setPredictions] = useState<Record<string, string[]>>(() => {
        const initialState: Record<string, string[]> = {};
        if (user?.championPicks) {
            for (const pick of user.championPicks) {
                initialState[pick.championshipId] = pick.teams;
            }
        }
        return initialState;
    });

    const [savedPicks, setSavedPicks] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        if (user?.championPicks) {
            for (const pick of user.championPicks) {
                initialState[pick.championshipId] = true;
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
        const championship = championships.find(c => c.id === championshipId);
        if (!championship || !championship.teamIds) return [];
        
        const participatingTeams = championship.teamIds
            .map(id => teams.find(team => team.id === id))
            .filter(Boolean as (value: any) => value is Team);
            
        const selectedValues = (predictions[championshipId] || []).filter((_, index) => index !== currentIndex);
        
        return participatingTeams
            .filter(team => !selectedValues.includes(team!.name))
            .map(team => ({ label: team!.name, value: team!.name }));
    };

    const handleSave = async (championshipId: string, championshipName: string) => {
        if (!user) return;
        const currentPicks = predictions[championshipId];
        const res = await saveChampionPicks(user.id, championshipId, currentPicks);
        if (res.success) {
            toast({
                title: "Palpites Salvos!",
                description: `Seus palpites de campeão para "${championshipName}" foram salvos com sucesso.`,
            });
            setSavedPicks(prev => ({...prev, [championshipId]: true}));
        } else {
             toast({
                title: "Erro ao Salvar",
                description: res.error,
                variant: "destructive",
            });
        }
    };

    if (!user || (openForPrediction.length === 0 && lockedPredictions.length === 0)) {
        return null;
    }

    return (
        <div className="space-y-6">
            {openForPrediction.length > 0 && (
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
                            {openForPrediction.map(champ => {
                                const numberOfPicks = champ.championPredictionSettings?.numberOfPicks || 1;
                                const picksArray = Array.from({ length: numberOfPicks });
                                const arePicksMade = predictions[champ.id]?.every(p => p && p.length > 0) && predictions[champ.id]?.length === numberOfPicks;

                                return (
                                    <AccordionItem value={champ.id} key={champ.id}>
                                        <AccordionTrigger>
                                            <div className="flex items-center gap-3 flex-1">
                                                {champ.iconUrl && (
                                                    <Image src={champ.iconUrl} alt="" width={24} height={24} />
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
                                                    {savedPicks[champ.id] ? 'Alterar Palpites' : 'Salvar Palpites'}
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
            )}

            {openForPrediction.length > 0 && lockedPredictions.length > 0 && <Separator />}

            {lockedPredictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Seus Palpites (Definidos)</CardTitle>
                        <CardDescription>Estes são seus palpites que já foram travados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <TooltipProvider>
                            {lockedPredictions.map(champ => {
                                const userPicks = predictions[champ.id] || [];
                                return (
                                    <div key={champ.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            {champ.iconUrl && <Image src={champ.iconUrl} alt="" width={20} height={20} />}
                                            <span className="font-semibold text-sm">{champ.nome}:</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {userPicks.map((pickName, index) => {
                                                const team = teams.find(t => t.name === pickName);
                                                return (
                                                    <Tooltip key={index}>
                                                        <TooltipTrigger asChild>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-bold">{index + 1}º</span>
                                                                {team && <Image src={team.crestUrl} alt={team.name} width={20} height={20} className="object-contain" />}
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>{pickName}</p></TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </TooltipProvider>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

    