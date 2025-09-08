
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Championship, Team, UserType } from '@/lib/types';
import { getChampionships, getTeams } from '@/lib/firebase/firestore';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PredictionForm } from '@/components/predictions/prediction-form';
import { ChampionPrediction } from '@/components/rules/champion-prediction';
import { Separator } from '@/components/ui/separator';

export default function PredictionsPage() {
    const { user, loading: authLoading } = useAuth();
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [userWithPicks, setUserWithPicks] = useState<UserType | null>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        setLoadingData(true);
        const fetchStaticData = async () => {
            try {
                const [champsData, teamsData] = await Promise.all([getChampionships(), getTeams()]);
                setChampionships(champsData);
                setTeams(teamsData);
            } catch (error) {
                console.error("Error fetching static data for predictions:", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchStaticData();

        let unsubUser: () => void = () => {};
        if (user) {
             unsubUser = onSnapshot(collection(db, 'users'), (snapshot) => {
                const currentUser = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as UserType))
                    .find(u => u.id === user.id);
                setUserWithPicks(currentUser || null);
            });
        }
        
        return () => {
            unsubUser();
        }

    }, [user, authLoading]);

    const isLoading = authLoading || loadingData || !userWithPicks;
    
    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <div className="flex items-center gap-4">
                    <CalendarCheck className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Fazer Palpites</h1>
                        <p className="text-muted-foreground">
                            Envie seus palpites para as próximas partidas e campeões.
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <>
                    <ChampionPrediction 
                        championships={championships} 
                        teams={teams}
                        user={userWithPicks}
                    />
                    
                    <Separator />

                    <PredictionForm championships={championships} />
                </>
            )}
        </div>
    );
}
