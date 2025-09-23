

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserType, Championship, Match, Prediction, TiebreakerRule } from '@/lib/types';
import { Medal, Award, Flashlight, ArrowUp, ArrowDown, Minus, BarChart3, Loader2, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Honorifics } from '@/components/shared/honorifics';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { getChampionships } from '@/lib/firebase/firestore';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isPast, parseISO } from 'date-fns';

export default function AdminRankingPage() {
  const searchParams = useSearchParams();
  const championshipIdFromQuery = searchParams.get('championshipId');
  type SortType = 'default' | 'exact' | 'situation' | 'combo' | 'bonus';

  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('default');

  useEffect(() => {
    async function fetchChampionships() {
        setLoading(true);
        try {
            const championshipsData = await getChampionships();
            setChampionships(championshipsData);
            
            if (championshipIdFromQuery) {
                setSelectedChampionshipId(championshipIdFromQuery);
            } else if (championshipsData.length > 0) {
                const activeChampionship = championshipsData.find(c => c.status === 'ativo');
                setSelectedChampionshipId(activeChampionship ? activeChampionship.id : championshipsData[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch championships:", error);
        }
    }
    fetchChampionships();
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType));
        setAllUsers(usersData);
        setLoading(false);
    });

    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
        const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
        setAllMatches(matchesData);
    });

    const unsubPredictions = onSnapshot(collection(db, "predictions"), (snapshot) => {
        const predictionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction));
        setAllPredictions(predictionsData);
    });

    return () => {
        unsubUsers();
        unsubMatches();
        unsubPredictions();
    };
  }, [championshipIdFromQuery]);

  const calculateLivePoints = (match: Match, prediction: Prediction): { pontos: number; exato: boolean; situacao: boolean; combo: boolean; bonus: boolean; } => {
    const { placarA: liveA, placarB: liveB } = match;
    const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
    const championship = championships.find(c => c.id === match.campeonatoId);
    
    if (liveA === undefined || liveA === null || liveB === undefined || liveB === null || !championship) {
      return { pontos: 0, exato: false, situacao: false, combo: false, bonus: false };
    }

    const pontuacao = championship.pontuacao;
    const totalGolsFinal = liveA + liveB;
    
    const acertouPlacarExato = guessA === liveA && guessB === liveB;
    const finalWinner = liveA > liveB ? 'A' : liveA < liveB ? 'B' : 'E';
    const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
    const acertouSituacao = finalWinner === guessWinner;
    
    let pontosGanhos = 0;
    let acertouCombo = false;
    let acertouBonus = false;

    const usouCombo = !!prediction.palpiteCombo;
    const acertouGols = usouCombo && prediction.palpiteCombo?.totalGols === totalGolsFinal;

    if (acertouPlacarExato) {
        pontosGanhos += pontuacao.tradicional.exato;
        if (acertouGols && pontuacao.combo) {
            pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
            acertouCombo = true;
        }
    } else if (acertouSituacao) {
        pontosGanhos += pontuacao.tradicional.situacao;
        if (acertouGols && pontuacao.combo) {
            pontosGanhos += pontuacao.combo.pontosGols;
        }
    } else if (acertouGols && pontuacao.combo) {
        pontosGanhos += pontuacao.combo.pontosGols;
        acertouBonus = true;
    }

    return { pontos: pontosGanhos, exato: acertouPlacarExato, situacao: acertouSituacao, combo: acertouCombo, bonus: acertouBonus };
  };
  
  const usersWithStatsForChampionship = useMemo(() => {
    if (!selectedChampionshipId) return [];
    
    const selectedChampionship = championships.find(c => c.id === selectedChampionshipId);
    if (!selectedChampionship) return [];
    
    const liveMatchesForChamp = allMatches.filter(match => 
        match.campeonatoId === selectedChampionshipId &&
        match.status !== 'Finalizado' && 
        match.status !== 'Cancelado' &&
        isPast(parseISO(match.data))
    );

    const participantUsers = allUsers.filter(user => selectedChampionship.participantes.includes(user.id));

    return participantUsers.map(user => {
      const stats = user.championshipStats?.find(s => s.championshipId === selectedChampionshipId);
      let basePoints = stats?.pontos ?? 0;
      let baseExatos = stats?.acertosExatos ?? 0;
      let baseSituacoes = stats?.acertosSituacao ?? 0;
      let baseCombos = 0;
      let baseBonus = 0;

      const predictionsInChamp = allPredictions.filter(p => p.userId === user.id && allMatches.some(m => m.id === p.matchId && m.campeonatoId === selectedChampionshipId && m.status === 'Finalizado'));
      predictionsInChamp.forEach(p => {
            if (p.acertoTipo === 'combo_bucha') {
              baseCombos++;
            }
            if (p.acertoTipo === 'bonus') {
              baseBonus++;
            }
      })

      liveMatchesForChamp.forEach(match => {
          const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === user.id);
          if (prediction) {
              const result = calculateLivePoints(match, prediction);
              basePoints += result.pontos;
              if (result.exato) baseExatos++;
              if (result.situacao) baseSituacoes++;
              if (result.combo) baseCombos++;
              if (result.bonus) baseBonus++;
          }
      });

      return {
        ...user,
        pontos: basePoints,
        exatos: baseExatos,
        situacoes: baseSituacoes,
        combo: baseCombos,
        bonus: baseBonus,
      }
    });
  }, [allUsers, selectedChampionshipId, allMatches, allPredictions, championships]);

  const selectedChampionship = useMemo(() => championships.find(c => c.id === selectedChampionshipId), [championships, selectedChampionshipId]);

  const sortedTableUsers = useMemo(() => {
      const tiebreakerRules = selectedChampionship?.regrasDesempate || [];
      const championshipMatches = allMatches.filter(m => m.campeonatoId === selectedChampionshipId).sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime());

      return [...usersWithStatsForChampionship].sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;

        for (const rule of tiebreakerRules) {
            switch (rule) {
                case 'maiorNumeroExatos':
                    if (a.exatos !== b.exatos) return b.exatos - a.exatos;
                    break;
                case 'maiorNumeroSituacoes':
                    if (a.situacoes !== b.situacoes) return b.situacoes - b.situacoes;
                    break;
                case 'primeiraBucha':
                    if (selectedChampionship?.pontuacao.tradicional) {
                        const maxPontos = selectedChampionship.pontuacao.tradicional.exato;
                        const buchasA = allPredictions.filter(p => p.userId === a.id && p.pontos === maxPontos).map(p => p.matchId);
                        const buchasB = allPredictions.filter(p => p.userId === b.id && p.pontos === maxPontos).map(p => p.matchId);

                        for (const match of championshipMatches) {
                            const aAcertou = buchasA.includes(match.id);
                            const bAcertou = buchasB.includes(match.id);
                            if (aAcertou && !bAcertou) return -1; // A leva vantagem
                            if (!aAcertou && bAcertou) return 1;  // B leva vantagem
                        }
                    }
                    break;
            }
        }
        
        // Critério final: data de cadastro
        const dateAValue = a.dataCadastro instanceof Date ? a.dataCadastro.getTime() : new Date(a.dataCadastro as string).getTime();
        const dateBValue = b.dataCadastro instanceof Date ? b.dataCadastro.getTime() : new Date(b.dataCadastro as string).getTime();
        return dateAValue - dateBValue;
    });
  }, [usersWithStatsForChampionship, selectedChampionshipId, selectedChampionship, allMatches, allPredictions]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500 fill-yellow-400" />;
    if (rank === 2) return <Award className="w-5 h-5 text-slate-400 fill-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700 fill-amber-700" />;
    if (rank === sortedTableUsers.length) return <Flashlight className="w-5 h-5 text-yellow-400 animate-flash-pulse" />;
    return null;
  };
  
  const getPositionVariation = (variation?: 'up' | 'down' | 'stable') => {
    switch (variation) {
      case 'up':
        return {
          icon: <ArrowUp className="w-4 h-4 text-green-500" />,
          tooltip: 'Subiu de posição',
          colorClass: 'text-green-500',
        };
      case 'down':
        return {
          icon: <ArrowDown className="w-4 h-4 text-destructive" />,
          tooltip: 'Desceu de posição',
          colorClass: 'text-destructive',
        };
      case 'stable':
      default:
        return {
          icon: <Minus className="w-4 h-4 text-primary" />,
          tooltip: 'Posição estável',
          colorClass: 'text-primary',
        };
    }
  };
  
  const getSortColumn = () => {
    switch (sortType) {
      case 'exact':
        return { header: 'Buchas', accessor: (user: any) => user.exatos };
      case 'situation':
        return { header: 'Situação', accessor: (user: any) => user.situacoes };
      case 'combo':
        return { header: 'Combo', accessor: (user: any) => user.combo };
      case 'bonus':
        return { header: 'Bônus', accessor: (user: any) => user.bonus };
      default:
        return { header: 'Pontos', accessor: (user: any) => user.pontos };
    }
  };

  const { header: sortColumnHeader, accessor: sortColumnAccessor } = getSortColumn();

  if (loading) {
      return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
            <BarChart3 className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Ranking Geral</h1>
                <p className="text-muted-foreground">Visualize a classificação de todos os jogadores.</p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h3 className="text-xl font-bold font-headline">Classificação Geral</h3>
            <div className="flex gap-2 w-full md:w-auto">
                 <Select value={selectedChampionshipId || ''} onValueChange={(v) => setSelectedChampionshipId(v)}>
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filtrar por campeonato" />
                    </SelectTrigger>
                    <SelectContent>
                        {championships.map(champ => (
                            <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
                    <SelectTrigger className="w-full md:w-[240px]">
                        <SelectValue placeholder="Critério de Ordenação" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default">Ordenar por Pontos</SelectItem>
                        <SelectItem value="exact">Ordenar por Buchas</SelectItem>
                        <SelectItem value="situation">Ordenar por Situação</SelectItem>
                        {selectedChampionship?.pontuacao.combo?.ativo && (
                            <>
                                <SelectItem value="combo">Ordenar por Combo</SelectItem>
                                <SelectItem value="bonus">Ordenar por Bônus</SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>


        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-16 text-center'>Pos.</TableHead>
                  <TableHead className='w-16 text-center'>Var.</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="text-right">{sortColumnHeader}</TableHead>
                  {sortType !== 'exact' && <TableHead className="text-right hidden md:table-cell">Buchas</TableHead>}
                  {sortType !== 'situation' && <TableHead className="text-right hidden md:table-cell">Situação</TableHead>}
                   {selectedChampionship?.pontuacao.combo?.ativo && (
                    <>
                      {sortType !== 'combo' && <TableHead className="text-right hidden md:table-cell">Combo</TableHead>}
                      {sortType !== 'bonus' && <TableHead className="text-right hidden md:table-cell">Bônus</TableHead>}
                    </>
                   )}
                   {sortType !== 'default' && <TableHead className="text-right hidden md:table-cell">Pontos</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTableUsers.map((user, index) => {
                  const rank = index + 1;
                  const variation = getPositionVariation(user.posicaoVariacao);
                  return (
                      <TableRow 
                        key={user.id} 
                        className={cn(
                            rank === 1 && "bg-gradient-to-r from-yellow-400/20 via-yellow-300/10 to-yellow-400/20 dark:from-yellow-500/20 dark:via-yellow-400/10 dark:to-yellow-500/20"
                        )}
                      >
                        <TableCell className="font-medium w-16 text-center">{rank}º</TableCell>
                        <TableCell className="w-16 text-center">
                          <Tooltip>
                              <TooltipTrigger>
                                  <div className={`flex items-center justify-center`}>
                                      {variation.icon}
                                  </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{variation.tooltip}</p>
                              </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                            <Link href={`/dashboard/profile?userId=${user.id}`} className="flex items-center gap-3 group">
                                <div className="relative">
                                    <Avatar className="w-9 h-9">
                                      <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                      <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                    <Honorifics count={user.titulos ?? 0} variant="badge" />
                                </div>
                                <span className="font-medium group-hover:underline">{user.apelido || user.nome}</span>
                                {getMedalIcon(rank)}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{sortColumnAccessor(user)}</TableCell>
                        {sortType !== 'exact' && <TableCell className="text-right hidden md:table-cell">{user.exatos}</TableCell>}
                        {sortType !== 'situation' && <TableCell className="text-right hidden md:table-cell">{user.situacoes}</TableCell>}
                        {selectedChampionship?.pontuacao.combo?.ativo && (
                            <>
                              {sortType !== 'combo' && <TableCell className="text-right hidden md:table-cell">{user.combo}</TableCell>}
                              {sortType !== 'bonus' && <TableCell className="text-right hidden md:table-cell">{user.bonus}</TableCell>}
                            </>
                        )}
                        {sortType !== 'default' && <TableCell className="text-right hidden md:table-cell font-semibold">{user.pontos}</TableCell>}
                      </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
