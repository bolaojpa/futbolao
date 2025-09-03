
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockChampionships, mockTeams } from '@/lib/data';
import { isFuture, parseISO } from 'date-fns';
import { Trophy, Save, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

export function ChampionPrediction() {
    const { toast } = useToast();
    
    // Filtra campeonatos que permitem palpite de campeão e ainda não começaram
    const availableChampionships = useMemo(() => {
        return mockChampionships.filter(champ => 
            champ.championPredictionSettings?.active && 
            isFuture(parseISO(champ.dataInicio as string))
        );
    }, []);

    // Estado para guardar os palpites do usuário para cada campeonato
    const [predictions, setPredictions] = useState<Record<string, string[]>>({});

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
            .filter(Boolean);
            
        const selectedValues = (predictions[championshipId] || []).filter((_, index) => index !== currentIndex);
        
        return participatingTeams
            .filter(team => !selectedValues.includes(team.name))
            .map(team => ({ label: team.name, value: team.name }));
    };

    const handleSave = (championshipId: string, championshipName: string) => {
        // Lógica de salvamento simulada
        console.log(`Salvando palpites para ${championshipName}:`, predictions[championshipId]);
        toast({
            title: "Palpites Salvos!",
            description: `Seus palpites de campeão para "${championshipName}" foram salvos com sucesso.`,
        });
    };

    if (availableChampionships.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="text-amber-500" />
                        Palpites de Campeão
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-4">Não há campeonatos abertos para palpites de campeão no momento.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {availableChampionships.map(champ => {
                const numberOfPicks = champ.championPredictionSettings?.numberOfPicks || 1;
                const picksArray = Array.from({ length: numberOfPicks });

                return (
                    <Card key={champ.id}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                {champ.iconUrl && (
                                    <Image src={champ.iconUrl} alt={champ.nome} width={40} height={40} />
                                )}
                                <div className="flex-1">
                                    <CardTitle>{champ.nome}</CardTitle>
                                    <CardDescription>
                                        Faça seus palpites para o ranking final. Os palpites serão bloqueados após o início do campeonato.
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary">{numberOfPicks} {numberOfPicks > 1 ? 'Escolhas' : 'Escolha'}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Separator />
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
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleSave(champ.id, champ.nome)}>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Palpites para este Campeonato
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}
