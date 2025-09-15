
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isFuture, parseISO, isPast } from 'date-fns';
import { CalendarCheck, Goal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Match, Prediction, Team, Championship, UserType } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getTeams, getUsers, getChampionships as fetchChampionships } from '@/lib/firebase/firestore';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChampionPrediction } from '@/components/rules/champion-prediction';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PredictionForm } from '@/components/predictions/prediction-form';

export default function PredictionsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | 'all'>('all');
    
    const activeChampionshipsForUser = useMemo(() => {
        if (!user) return [];
        return championships.filter(c => c.status === 'ativo' && c.participantes.includes(user.id));
    }, [championships, user]);

    useEffect(() => {
        if (activeChampionshipsForUser.length > 0 && selectedChampionshipId === 'all') {
            setSelectedChampionshipId(activeChampionshipsForUser[0].id);
        }
    }, [activeChampionshipsForUser, selectedChampionshipId]);
    
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/');
            return;
        }

        async function fetchStaticData() {
            setLoadingData(true);
            try {
                const [teamsData, usersData, championshipsData] = await Promise.all([getTeams(), getUsers(), fetchChampionships()]);
                setAllTeams(teamsData);
                setAllUsers(usersData);
                setChampionships(championshipsData);
            } catch (error) {
                toast({ title: "Erro ao buscar dados", description: "Não foi possível carregar equipes, usuários e campeonatos.", variant: "destructive" });
            } finally {
                setLoadingData(false);
            }
        }
        fetchStaticData();
        
        const unsubMatches = onSnapshot(collection(db, 'matches'), (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
            setAllMatches(matchesData);
        });

        return () => {
            unsubMatches();
        };

    }, [authLoading, user, router, toast]);


    if (authLoading || loadingData || !user) {
        return <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            {[1, 2, 3].map(i => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-24 bg-muted rounded-md animate-pulse"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    }

    const hasOpenChampionPredictions = championships.some(c => 
        c.championPredictionSettings?.active && 
        isFuture(parseISO(c.dataInicio as string)) &&
        c.participantes.includes(user.id)
    );
    
    const hasOpenMatches = allMatches.some(m =>
      m.status === 'Agendado' &&
      !isPast(parseISO(m.data)) &&
      activeChampionshipsForUser.some(c => c.id === m.campeonatoId)
    );


    if (!hasOpenChampionPredictions && !hasOpenMatches) {
        return (
             <Card className="m-4 sm:m-6 lg:p-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                         <CalendarCheck className="h-6 w-6 text-primary" />
                        Palpites
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-10 text-center">
                     <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                        <Goal className="w-12 h-12 text-muted-foreground" />
                    </div>
                     <p className="text-lg font-semibold">Tudo em dia!</p>
                     <p className="text-muted-foreground mt-2">
                        Não há palpites (de partidas ou de campeão) abertos no momento.
                        <br/>
                        Volte mais tarde ou verifique o dashboard.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <CalendarCheck className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Meus Palpites</h1>
                        <p className="text-muted-foreground">
                            Registre ou altere seus palpites para as próximas partidas.
                        </p>
                    </div>
                </div>
                {activeChampionshipsForUser.length > 1 && (
                    <div className="w-full sm:w-auto">
                        <Select value={selectedChampionshipId} onValueChange={(value) => setSelectedChampionshipId(value)}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Filtrar por campeonato" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Campeonatos Ativos</SelectItem>
                                {activeChampionshipsForUser.map(champ => (
                                    <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <ChampionPrediction championships={championships} teams={allTeams} user={user} />
            
            <PredictionForm 
                championships={championships} 
                allTeams={allTeams} 
                allMatches={allMatches}
                selectedChampionshipId={selectedChampionshipId}
            />

        </div>
    );
}
