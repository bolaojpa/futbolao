

'use client';

import { useState, useEffect } from 'react';
import { HallOfFameCarousel } from '@/components/fame/hall-of-fame-carousel';
import { ShieldCheck, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Championship, UserType, Match, Prediction } from '@/lib/types';
import { getChampionships, getUsers, getMatches } from '@/lib/firebase/firestore';
import type { ChampionBannerProps } from '@/components/fame/champion-banner';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';

export default function FamePage() {
    const [banners, setBanners] = useState<ChampionBannerProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHallOfFameData = async () => {
            try {
                const [championships, users, allMatches, allPredictionsDocs] = await Promise.all([
                    getChampionships(), 
                    getUsers(),
                    getMatches(),
                    getDocs(collection(db, 'predictions'))
                ]);

                const allPredictions = allPredictionsDocs.docs.map(d => ({ id: d.id, ...d.data() } as Prediction));
                
                const hallOfFameChamps = championships
                    .filter(c => c.banner?.ativo && c.status === 'arquivado')
                    .sort((a, b) => {
                        const timeA = (a.createdAt as Timestamp)?.toMillis() || 0;
                        const timeB = (b.createdAt as Timestamp)?.toMillis() || 0;
                        return timeB - timeA;
                    });

                const bannerData: ChampionBannerProps[] = hallOfFameChamps.map(champ => {
                    let campeaoGeralNome = 'EM BREVE';
                    let campeaoGeralAvatarUrl = 'https://ui-avatars.com/api/?name=?&background=random';
                    let palpiteiroNome = 'EM BREVE';
                    let palpiteiroAvatarUrl = 'https://ui-avatars.com/api/?name=?&background=random';

                    // Lógica para Campeão Geral (maior pontuador)
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

                    // Lógica para Palpiteiro (quem acertou o campeão)
                    if (champ.finalRanking && champ.championPredictionSettings?.active) {
                        const finalRankingOrder = Object.values(champ.finalRanking).filter(Boolean) as string[];
                        
                        let bestTier: { rank: number; pick: number } | null = null;
                        let tierContenders: UserType[] = [];

                        for (let rankIndex = 0; rankIndex < finalRankingOrder.length; rankIndex++) {
                            const rankedTeam = finalRankingOrder[rankIndex];
                            for (let pickIndex = 0; pickIndex < (champ.championPredictionSettings?.numberOfPicks || 0); pickIndex++) {
                                const contenders = users.filter(u => u.championPicks?.some(p => p.championshipId === champ.id && p.teams[pickIndex] === rankedTeam));
                                if (contenders.length > 0) {
                                    bestTier = { rank: rankIndex, pick: pickIndex };
                                    tierContenders = contenders;
                                    break;
                                }
                            }
                            if (bestTier) break;
                        }

                        let finalWinners: UserType[] = [];

                        if (bestTier && tierContenders.length > 0) {
                             finalWinners = [...tierContenders];

                            // 1. Desempate por palpites subsequentes
                            if (finalWinners.length > 1) {
                                for (let nextPickIndex = bestTier.pick + 1; nextPickIndex < (champ.championPredictionSettings?.numberOfPicks || 0); nextPickIndex++) {
                                    if (finalWinners.length === 1) break;

                                    const nextPickWinners: { user: UserType, rank: number }[] = [];
                                    for (const user of finalWinners) {
                                        const userPick = user.championPicks?.find(p => p.championshipId === champ.id)?.teams[nextPickIndex];
                                        if (userPick) {
                                            const rank = finalRankingOrder.indexOf(userPick);
                                            if (rank !== -1) {
                                                nextPickWinners.push({ user, rank });
                                            }
                                        }
                                    }

                                    if (nextPickWinners.length > 0) {
                                        const bestNextRank = Math.min(...nextPickWinners.map(w => w.rank));
                                        const newTiedUsers = nextPickWinners.filter(w => w.rank === bestNextRank).map(w => w.user);
                                        if (newTiedUsers.length > 0 && newTiedUsers.length < finalWinners.length) {
                                            finalWinners = newTiedUsers;
                                        }
                                    }
                                }
                            }

                            // 2. Desempate pelo jogo final
                            if (finalWinners.length > 1) {
                                const finalMatch = allMatches
                                    .filter(m => m.campeonatoId === champ.id && m.fase.toLowerCase().includes('final'))
                                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];

                                if (finalMatch) {
                                    const buchaWinners = finalWinners.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'bucha' || p.acertoTipo === 'combo')));
                                    if (buchaWinners.length > 0 && buchaWinners.length < finalWinners.length) {
                                        finalWinners = buchaWinners;
                                    } else {
                                        const situationWinners = finalWinners.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'situacao' || p.acertoTipo === 'bonus')));
                                        if (situationWinners.length > 0 && situationWinners.length < finalWinners.length) {
                                            finalWinners = situationWinners;
                                        }
                                    }
                                }
                            }
                            
                            // 3. Desempate por antiguidade
                            if (finalWinners.length > 1) {
                                finalWinners.sort((a, b) => {
                                    const dateA = a.dataCadastro instanceof Timestamp ? a.dataCadastro.toMillis() : new Date(a.dataCadastro as string).getTime();
                                    const dateB = b.dataCadastro instanceof Timestamp ? b.dataCadastro.toMillis() : new Date(b.dataCadastro as string).getTime();
                                    return dateA - dateB;
                                });
                                finalWinners = [finalWinners[0]];
                            }
                        }
                        
                        if (finalWinners.length > 0) {
                            palpiteiroNome = finalWinners.map(u => u.apelido).join(', ');
                            palpiteiroAvatarUrl = finalWinners[0]?.fotoPerfil || 'https://ui-avatars.com/api/?name=?&background=random';
                        } else {
                            palpiteiroNome = 'Ninguém';
                        }
                    }

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
