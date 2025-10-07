

"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isFuture, parseISO, subMinutes, format, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, Save, CheckCircle, ChevronDown, AlarmClock } from 'lucide-react';
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
import type { Championship, Team, UserType, Match } from '@/lib/types';
import { saveChampionPicks } from '@/app/dashboard/predictions/actions';
import { cn } from '@/lib/utils';
import { Countdown } from '../shared/countdown';

interface ChampionPredictionProps {
    championships: Championship[];
    teams: Team[];
    user: UserType | null;
    allMatches: Match[];
}

const ChampionPredictionForm = ({ champ, teams, user, onSave }: { champ: Championship, teams: Team[], user: UserType, onSave: (champId: string, champName: string) => Promise<void> }) => {
    const [localPicks, setLocalPicks] = useState<string[]>(() => {
        const existingPicks = user.championPicks?.find(p => p.championshipId === champ.id)?.teams || [];
        return Array.from({ length: champ.championPredictionSettings!.numberOfPicks }, (_, i) => existingPicks[i] || '');
    });

    const participatingTeams = useMemo(() => {
        return champ.teamIds
            .map(id => teams.find(team => team.id === id))
            .filter(Boolean as (value: any) => value is Team);
    }, [champ.teamIds, teams]);

    const getTeamOptions = (currentIndex: number) => {
        const selectedValues = localPicks.filter((_, index) => index !== currentIndex);
        return participatingTeams
            .filter(team => !selectedValues.includes(team.name))
            .map(team => ({ label: team.name, value: team.name }));
    };

    const handlePredictionChange = (index: number, value: string) => {
        const newPicks = [...localPicks];
        newPicks[index] = value;
        setLocalPicks(newPicks);
    };

    const handleSaveClick = async () => {
        await saveChampionPicks(user.id, champ.id, localPicks);
        onSave(champ.id, champ.nome);
    };
    
    const arePicksComplete = localPicks.every(p => p && p.length > 0) && localPicks.length === champ.championPredictionSettings!.numberOfPicks;

    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: champ.championPredictionSettings!.numberOfPicks }).map((_, index) => (
                <div key={index} className="space-y-2">
                    <Label htmlFor={`prediction-${champ.id}-${index}`}>{index + 1}º Lugar</Label>
                    <Combobox
                        options={getTeamOptions(index)}
                        value={localPicks[index]}
                        onChange={(value) => handlePredictionChange(index, value)}
                        placeholder="Selecione a equipe..."
                        searchPlaceholder="Buscar equipe..."
                        notFoundMessage="Nenhuma equipe encontrada."
                    />
                </div>
            ))}
            <div className="flex justify-end">
                <Button onClick={handleSaveClick} disabled={!arePicksComplete} size="icon">
                    <Save className="h-4 w-4" />
                    <span className="sr-only">Salvar Palpites</span>
                </Button>
            </div>
        </div>
    );
};

export function ChampionPrediction({ championships, teams, user, allMatches }: ChampionPredictionProps) {
    const { toast } = useToast();

    const { openForPrediction, lockedPredictions } = useMemo(() => {
        const open: Championship[] = [];
        const locked: Championship[] = [];
        if (!user || !championships) return { openForPrediction: [], lockedPredictions: [] };

        championships
            .filter(champ => champ.status === 'ativo') // Apenas campeonatos ativos
            .forEach(champ => {
                if (!champ.championPredictionSettings?.active) return;
                
                const hasPrediction = user.championPicks?.some(p => p.championshipId === champ.id);
                
                // Lógica de fechamento baseada na primeira partida
                const firstMatch = allMatches
                    .filter(m => m.campeonatoId === champ.id)
                    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];
                
                let isPredictionOpen = true;
                if (firstMatch) {
                    const closingTime = subMinutes(parseISO(firstMatch.data), 15);
                    isPredictionOpen = isFuture(closingTime);
                } else {
                    // Se não houver jogos, use a data de início do campeonato como fallback
                    const startDateString = typeof champ.dataInicio === 'string' ? champ.dataInicio : champ.dataInicio.toISOString();
                    isPredictionOpen = isFuture(parseISO(startDateString));
                }


                if (isPredictionOpen) {
                    open.push(champ);
                } else if (hasPrediction) {
                    locked.push(champ);
                }
            });
        return { openForPrediction: open, lockedPredictions: locked };
    }, [championships, user, allMatches]);
    
    const [savedPicks, setSavedPicks] = useState<Record<string, boolean>>(() => {
        const initialState: Record<string, boolean> = {};
        if (user?.championPicks) {
            for (const pick of user.championPicks) {
                initialState[pick.championshipId] = true;
            }
        }
        return initialState;
    });

    const handleSave = async (championshipId: string, championshipName: string) => {
        toast({
            title: "Palpites Salvos!",
            description: `Seus palpites de campeão para "${championshipName}" foram salvos com sucesso.`,
        });
        setSavedPicks(prev => ({...prev, [championshipId]: true}));
    };

    if (!user || (openForPrediction.length === 0 && lockedPredictions.length === 0)) {
        return null;
    }
    
    const DeadlineDisplay = ({ champ }: { champ: Championship }) => {
        const firstMatch = allMatches
            .filter(m => m.campeonatoId === champ.id)
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())[0];

        if (!firstMatch) return null;

        const closingTime = subMinutes(parseISO(firstMatch.data), 15);
        
        if (!isFuture(closingTime)) return null;

        const hoursDiff = differenceInHours(closingTime, new Date());

        return (
            <div className="text-xs font-semibold text-accent flex items-center justify-center gap-2 mt-2">
                <AlarmClock className="w-4 h-4" />
                {hoursDiff < 1 ? (
                    <Countdown targetDate={closingTime.toISOString()} prefix="Encerra em: " />
                ) : (
                    <span>Encerra em: {format(closingTime, "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {openForPrediction.length > 0 && (
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Trophy className="h-6 w-6 text-amber-500" />
                                <div>
                                    <CardTitle>Palpites de Campeão</CardTitle>
                                    <CardDescription>
                                        Faça sua aposta no ranking final.
                                    </CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full space-y-2">
                             {openForPrediction.map(champ => {
                                const userHasPicks = savedPicks[champ.id];
                                 return (
                                    <AccordionItem value={champ.id} key={champ.id} className="border rounded-md">
                                        <AccordionTrigger className={cn("p-3 hover:no-underline rounded-md bg-muted/50 hover:bg-muted")}>
                                             <div className="flex items-center justify-between w-full">
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="flex items-center gap-3">
                                                        {champ.iconUrl && <Image src={champ.iconUrl} alt="" width={24} height={24} />}
                                                        <span className="font-semibold">{champ.nome}</span>
                                                    </div>
                                                    <DeadlineDisplay champ={champ} />
                                                </div>
                                                <div className="flex items-center gap-2 mr-2">
                                                    {userHasPicks ? (
                                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span className='hidden sm:inline'>Palpite Salvo</span>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="warning">Pendente</Badge>
                                                    )}
                                                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ChampionPredictionForm champ={champ} teams={teams} user={user} onSave={handleSave} />
                                        </AccordionContent>
                                    </AccordionItem>
                                 )
                             })}
                        </Accordion>
                    </CardContent>
                </Card>
            )}

            {(openForPrediction.length > 0 && lockedPredictions.length > 0) && <Separator />}

            {lockedPredictions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Seus Palpites (Definidos)</CardTitle>
                        <CardDescription>Estes são seus palpites que já foram travados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <TooltipProvider>
                            {lockedPredictions.map(champ => {
                                const userPicks = user.championPicks?.find(p => p.championshipId === champ.id)?.teams || [];
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
                                                            <div className="flex items-center gap-1 cursor-default">
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
