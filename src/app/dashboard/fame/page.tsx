

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

                const getChampionPickWinner = (championship: Championship): { winnerIds: string[]; validPicks: Record<string, string[]> } => {
                    if (!championship.finalRanking || !championship.championPredictionSettings?.active) return { winnerIds: [], validPicks: {} };

                    const finalRankingOrder = Object.values(championship.finalRanking).filter(Boolean) as string[];
                    if (finalRankingOrder.length === 0) return { winnerIds: [], validPicks: {} };

                    let candidates: UserType[] = [];
                    let bestTier = { rank: Infinity, pick: Infinity };

                    for (let rankIndex = 0; rankIndex < finalRankingOrder.length; rankIndex++) {
                        const rankedTeam = finalRankingOrder[rankIndex];
                        for (let pickIndex = 0; pickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); pickIndex++) {
                            const contenders = users.filter(u =>
                                u.championPicks?.some(p => p.championshipId === championship.id && p.teams[pickIndex] === rankedTeam)
                            );
                            if (contenders.length > 0 && rankIndex < bestTier.rank) {
                                bestTier = { rank: rankIndex, pick: pickIndex };
                                candidates = contenders;
                                break; 
                            }
                        }
                        if (candidates.length > 0) break;
                    }

                    if (candidates.length === 0) return { winnerIds: [], validPicks: {} };

                    for (let nextPickIndex = 0; nextPickIndex < (championship.championPredictionSettings?.numberOfPicks || 0); nextPickIndex++) {
                        if (candidates.length <= 1) break;
                        if (nextPickIndex === bestTier.pick) continue;

                        let bestNextRank = Infinity;
                        const nextPickWinners: { user: UserType; rank: number }[] = [];

                        for (const user of candidates) {
                            const userPick = user.championPicks?.find(p => p.championshipId === championship.id)?.teams[nextPickIndex];
                            if (userPick) {
                                const rank = finalRankingOrder.indexOf(userPick);
                                if (rank !== -1) {
                                    nextPickWinners.push({ user, rank });
                                    if (rank < bestNextRank) bestNextRank = rank;
                                }
                            }
                        }
                        if(nextPickWinners.length > 0) {
                            const newTiedUsers = nextPickWinners.filter(w => w.rank === bestNextRank).map(w => w.user);
                            if (newTiedUsers.length > 0 && newTiedUsers.length < candidates.length) {
                                candidates = newTiedUsers;
                            }
                        }
                    }

                    if (candidates.length > 1) {
                        const finalMatch = allMatches.filter(m => m.campeonatoId === championship.id && m.fase.toLowerCase().includes('final')).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
                        if (finalMatch) {
                            const buchaWinners = candidates.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'bucha' || p.acertoTipo === 'combo')));
                            if (buchaWinners.length > 0 && buchaWinners.length < candidates.length) {
                                candidates = buchaWinners;
                            } else {
                                const situationWinners = candidates.filter(u => allPredictions.some(p => p.userId === u.id && p.matchId === finalMatch.id && (p.acertoTipo === 'situacao' || p.acertoTipo === 'bonus')));
                                if (situationWinners.length > 0 && situationWinners.length < candidates.length) {
                                    candidates = situationWinners;
                                }
                            }
                        }
                    }

                    if (candidates.length > 1) {
                        candidates.sort((a, b) => (new Date(a.dataCadastro as string).getTime()) - (new Date(b.dataCadastro as string).getTime()));
                        candidates = [candidates[0]];
                    }

                    const validPicks: Record<string, string[]> = {};
                    candidates.forEach(winner => {
                        const winnerPicks = winner.championPicks?.find(p => p.championshipId === championship.id)?.teams || [];
                        const correctPicksInSequence: string[] = [];
                        for (let i = 0; i < winnerPicks.length; i++) {
                             const pick = winnerPicks[i];
                             const actualRank = finalRankingOrder.indexOf(pick);
                             if (actualRank !== -1) {
                                 correctPicksInSequence.push(pick);
                             } else {
                                 break;
                             }
                        }
                        validPicks[winner.id] = correctPicksInSequence;
                    });
                    
                    return { winnerIds: candidates.map(u => u.id), validPicks };
                };


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
                    const winnerInfo = getChampionPickWinner(champ);
                    if (winnerInfo.winnerIds.length > 0) {
                        const winners = users.filter(u => winnerInfo.winnerIds.includes(u.id));
                        palpiteiroNome = winners.map(u => u.apelido).join(', ');
                        palpiteiroAvatarUrl = winners[0]?.fotoPerfil || 'https://ui-avatars.com/api/?name=?&background=random';
                    } else {
                        palpiteiroNome = 'Ninguém';
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
