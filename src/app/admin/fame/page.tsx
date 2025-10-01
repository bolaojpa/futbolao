
'use client';

import { useState, useEffect } from 'react';
import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { ShieldCheck, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Championship, UserType } from '@/lib/types';
import { getChampionships, getUsers } from '@/lib/firebase/firestore';
import type { ChampionBannerProps } from '@/components/fame/champion-banner';

export default function AdminFamePage() {
    const [banners, setBanners] = useState<ChampionBannerProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHallOfFameData = async () => {
            try {
                const [championships, users] = await Promise.all([getChampionships(), getUsers()]);
                
                const hallOfFameChamps = championships.filter(c => c.banner?.ativo);

                const bannerData: ChampionBannerProps[] = hallOfFameChamps.map(champ => {
                    let campeaoGeralNome = '';
                    let campeaoGeralAvatarUrl = '';
                    let palpiteiroNome = '';
                    let palpiteiroAvatarUrl = '';

                    if (champ.status === 'arquivado') {
                        let winnerUser: UserType | undefined;

                        // 1. Tenta encontrar o vencedor pelo palpite de campeão
                        if (champ.finalRanking?.pos1 && champ.championPredictionSettings?.active) {
                            const winningTeamName = champ.finalRanking.pos1;
                            winnerUser = users.find(u => 
                                u.championPicks?.some(p => 
                                    p.championshipId === champ.id && p.teams[0] === winningTeamName
                                )
                            );
                        }

                        // 2. Se não encontrou (ou a função não estava ativa), busca o usuário com mais pontos
                        if (!winnerUser) {
                            const participants = users.filter(u => champ.participantes.includes(u.id));
                            if (participants.length > 0) {
                                winnerUser = participants.sort((a, b) => {
                                    const pointsA = a.championshipStats?.find(s => s.championshipId === champ.id)?.pontos ?? 0;
                                    const pointsB = b.championshipStats?.find(s => s.championshipId === champ.id)?.pontos ?? 0;
                                    return pointsB - pointsA;
                                })[0];
                            }
                        }
                        
                        if (winnerUser) {
                            campeaoGeralNome = winnerUser.apelido || '';
                            campeaoGeralAvatarUrl = winnerUser.fotoPerfil || '';
                        }
                        
                        // Lógica simplificada, pode ser expandida. Usando o mesmo campeão por enquanto.
                        palpiteiroNome = campeaoGeralNome;
                        palpiteiroAvatarUrl = campeaoGeralAvatarUrl;
                    }


                    return {
                        id: champ.id,
                        campeonatoLogoUrl: champ.banner?.campeonatoLogoUrl || champ.iconUrl || '',
                        campeonatoNome: champ.nome,
                        campeaoGeralNome: campeaoGeralNome,
                        campeaoGeralAvatarUrl: campeaoGeralAvatarUrl,
                        modoEquipes: champ.modoEquipes,
                        palpiteiroNome: palpiteiroNome,
                        palpiteiroAvatarUrl: palpiteiroAvatarUrl,
                        displayMode: champ.banner?.displayMode || 'photo_and_names',
                        backgroundUrl: champ.banner?.backgroundUrl
                    };
                });

                setBanners(bannerData);
            } catch (error) {
                console.error("Failed to fetch hall of fame data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHallOfFameData();
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
                        Visualize os banners dos campeões de cada temporada.
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
                           Quando campeonatos forem finalizados com a opção de banner ativada, <br/> os banners dos vencedores aparecerão aqui.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
