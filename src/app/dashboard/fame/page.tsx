
'use client';

import { useState, useEffect } from 'react';
import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { ShieldCheck, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Championship, UserType, Match, Prediction } from '@/lib/types';
import type { ChampionBannerProps } from '@/components/fame/champion-banner';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

export default function FamePage() {
    const [banners, setBanners] = useState<ChampionBannerProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const qChampionships = query(collection(db, "championships"));
        const qUsers = query(collection(db, "users"));

        const unsubChampionships = onSnapshot(qChampionships, (championshipsSnap) => {
            const championships = championshipsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Championship));
            
            const unsubUsers = onSnapshot(qUsers, (usersSnap) => {
                const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
                
                const bannerData: ChampionBannerProps[] = championships
                    .filter(c => c.banner?.ativo && c.status === 'arquivado')
                    .sort((a, b) => {
                        const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
                        const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
                        return timeB - timeA;
                    })
                    .map(champ => {
                        let campeaoGeralNome = 'EM BREVE';
                        let campeaoGeralAvatarUrl = 'https://ui-avatars.com/api/?name=?&background=random';
                        let palpiteiroNome = 'EM BREVE';
                        let palpiteiroAvatarUrl = 'https://ui-avatars.com/api/?name=?&background=random';

                        const participants = users.filter(u => champ.participantes.includes(u.id));
                        if (participants.length > 0) {
                            const winnerByPoints = participants.sort((a, b) => {
                                const pointsA = a.championshipStats?.find(s => s.championshipId === champ.id)?.pontos ?? 0;
                                const pointsB = b.championshipStats?.find(s => s.championshipId === champ.id)?.pontos ?? 0;
                                return pointsB - pointsA;
                            })[0];
                            
                            if (winnerByPoints) {
                                campeaoGeralNome = winnerByPoints.apelido || '';
                                campeaoGeralAvatarUrl = winnerByPoints.fotoPerfil || '';
                            }
                        }
                        
                        // A lógica do palpiteiro foi removida temporariamente

                        return {
                            id: champ.id,
                            campeonatoLogoUrl: champ.banner?.campeonatoLogoUrl || champ.iconUrl || '',
                            campeonatoNome: champ.nome,
                            campeaoGeralNome,
                            campeaoGeralAvatarUrl,
                            modoEquipes: champ.modoEquipes,
                            palpiteiroNome,
                            palpiteiroAvatarUrl,
                            displayMode: champ.banner?.displayMode || 'photo_and_names',
                            backgroundUrl: champ.banner?.backgroundUrl,
                            banner: {
                                titleColor: champ.banner?.titleColor,
                                subtitleColor: champ.banner?.subtitleColor,
                                namesColor: champ.banner?.namesColor,
                            }
                        };
                    });
                setBanners(bannerData);
                setLoading(false);
            });

            return () => unsubUsers();
        });

        return () => {
            unsubChampionships();
        };
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                 <ShieldCheck className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Hall da Fama</h1>
                    <p className="text-muted-foreground">
                        Um espaço dedicado aos grandes campeões de cada temporada.
                    </p>
                </div>
            </div>

            {banners.length > 0 ? (
                <HallOfFameCarousel banners={banners} />
            ) : (
                <Card>
                    <CardContent className="p-10 text-center">
                        <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                            <Trophy className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold">O Hall da Fama Aguarda Seus Campeões!</h3>
                        <p className="text-muted-foreground mt-2">
                            Nenhum campeonato foi finalizado com a opção de banner ativada ainda. <br/> Os banners dos vencedores aparecerão aqui.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
