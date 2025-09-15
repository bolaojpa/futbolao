
"use client";

import { useState, useMemo, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
    const [modalState, setModalState] = useState<{ open: boolean, champId: string | null }>({ open: false, champId: null });

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

    useEffect(() => {
        if (!user || openForPrediction.length === 0) return;

        const champToPrompt = openForPrediction.find(champ => {
            const userPick = user.championPicks?.find(p => p.championshipId === champ.id);
            return !userPick;
        });

        if (champToPrompt) {
            setTimeout(() => {
                setModalState({ open: true, champId: champToPrompt.id });
            }, 1000); 
        }
    }, [openForPrediction, user]);


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
            setModalState({ open: false, champId: null });
        } else {
             toast({
                title: "Erro ao Salvar",
                description: res.error,
                variant: "destructive",
            });
        }
    };
    
    const renderModalContent = () => {
        const champ = championships.find(c => c.id === modalState.champId);
        if (!champ) return null;
        
        const numberOfPicks = champ.championPredictionSettings?.numberOfPicks || 1;
        const picksArray = Array.from({ length: numberOfPicks });
        const arePicksMade = predictions[champ.id]?.every(p => p && p.length > 0) && predictions[champ.id]?.length === numberOfPicks;

        return (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Trophy className="text-amber-500" /> Palpite de Campeão: {champ.nome}</DialogTitle>
                    <DialogDescription>
                        Faça suas apostas para o ranking final. Você pode alterar seus palpites até o início do campeonato.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    {picksArray.map((_, index) => (
                        <div key={index} className="space-y-2">
                            <Label htmlFor={`modal-prediction-${champ.id}-${index}`}>{index + 1}º Lugar</Label>
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
                </div>
                <div className="flex justify-end">
                    <Button onClick={() => handleSave(champ.id, champ.nome)} disabled={!arePicksMade}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar e Fechar
                    </Button>
                </div>
            </>
        )
    }

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
                                <CardTitle>Palpites de Campeão (Abertos)</CardTitle>
                                <CardDescription>
                                    Clique em um campeonato para registrar ou alterar seu palpite final.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {openForPrediction.map(champ => {
                            const userHasPicks = savedPicks[champ.id];
                             return (
                                <button key={champ.id} onClick={() => setModalState({ open: true, champId: champ.id })} className="w-full text-left">
                                <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors border">
                                    <div className="flex items-center gap-3">
                                        {champ.iconUrl && <Image src={champ.iconUrl} alt="" width={24} height={24} />}
                                        <span className="font-semibold">{champ.nome}</span>
                                    </div>
                                    {userHasPicks ? (
                                        <div className="flex items-center gap-2 text-sm text-green-600">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Palpite Salvo</span>
                                        </div>
                                    ) : (
                                        <Badge variant="warning">Palpite Pendente</Badge>
                                    )}
                                </div>
                                </button>
                             )
                        })}
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

            <Dialog open={modalState.open} onOpenChange={(open) => setModalState({ open, champId: open ? modalState.champId : null })}>
                <DialogContent>
                    {renderModalContent()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
