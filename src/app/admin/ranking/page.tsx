
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
import type { UserType, Championship, Match, Prediction } from '@/lib/types';
import { Medal, Award, Flashlight, ArrowUp, ArrowDown, Minus, BarChart3, Loader2 } from 'lucide-react';
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
  
  type SortType = 'default' | 'exact' | 'situation';

  const [sortType, setSortType] = useState<SortType>('default');
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

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
        const live = matchesData.filter(match => 
            match.status !== 'Finalizado' && 
            match.status !== 'Cancelado' &&
            isPast(parseISO(match.data))
        );
        setLiveMatches(live);
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

  const calculateLivePoints = (match: Match, prediction: Prediction): number => {
    if (match.placarA === undefined || match.placarA === null || match.placarB === undefined || match.placarB === null) return 0;
    
    const championship = championships.find(c => c.id === match.campeonatoId);
    if (!championship) return 0;

    const { placarA: liveA, placarB: liveB } = match;
    const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
    const pontuacao = championship.pontuacao.tradicional;

    if (guessA === liveA && guessB === liveB) {
        return pontuacao.exato; 
    }

    const liveWinner = liveA > liveB ? 'A' : liveA < liveB ? 'B' : 'E';
    const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';

    if (liveWinner === guessWinner) {
        return pontuacao.situacao;
    }

    return 0;
  };
  
  const usersWithStatsForChampionship = useMemo(() => {
    if (!selectedChampionshipId) return [];

    return allUsers.map(user => {
      const stats = user.championshipStats?.find(s => s.championshipId === selectedChampionshipId);
      const basePoints = stats?.pontos ?? 0;
      const baseExatos = stats?.acertosExatos ?? 0;
      const baseSituacoes = stats?.acertosSituacao ?? 0;

      let livePoints = 0;
      liveMatches.forEach(match => {
          if(match.campeonatoId === selectedChampionshipId) {
              const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === user.id);
              if (prediction) {
                  livePoints += calculateLivePoints(match, prediction);
              }
          }
      });

      return {
        ...user,
        pontos: basePoints + livePoints,
        exatos: baseExatos,
        situacoes: baseSituacoes,
      }
    });
  }, [allUsers, selectedChampionshipId, liveMatches, allPredictions, championships]);


  const sortedTableUsers = useMemo(() => {
      return [...usersWithStatsForChampionship].sort((a, b) => {
        switch (sortType) {
            case 'exact':
                if (a.exatos !== b.exatos) return b.exatos - a.exatos;
                break;
            case 'situation':
                if (a.situacoes !== b.situacoes) return b.situacoes - a.situacoes;
                break;
            default:
                if (a.pontos !== b.pontos) return b.pontos - a.pontos;
                if (a.exatos !== b.exatos) return b.exatos - a.exatos;
                if (a.situacoes !== b.situacoes) return b.situacoes - a.situacoes;
                break;
        }
        const dateA = a.dataCadastro instanceof Date ? a.dataCadastro.getTime() : new Date(a.dataCadastro as string).getTime();
        const dateB = b.dataCadastro instanceof Date ? b.dataCadastro.getTime() : new Date(b.dataCadastro as string).getTime();
        return dateA - dateB;
    })
  }, [usersWithStatsForChampionship, sortType]);

  const getSortColumn = () => {
    switch (sortType) {
      case 'exact':
        return {
          header: 'Buchas',
          accessor: (user: { exatos: number }) => user.exatos,
        };
      case 'situation':
        return {
          header: 'Situação',
          accessor: (user: { situacoes: number }) => user.situacoes,
        };
      default:
        return {
          header: 'Pontos',
          accessor: (user: { pontos: number }) => user.pontos,
        };
    }
  };

  const { header: sortColumnHeader, accessor: sortColumnAccessor } = getSortColumn();

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
                        <SelectItem value="default">Ordenar por Pontos (Padrão)</SelectItem>
                        <SelectItem value="exact">Ordenar por Buchas</SelectItem>
                        <SelectItem value="situation">Ordenar por Situação</SelectItem>
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
                  <TableHead className="text-right hidden md:table-cell">
                    {sortType === 'default' ? 'Buchas' : 'Pontos'}
                  </TableHead>
                   <TableHead className="text-right hidden md:table-cell">
                    {sortType === 'situation' ? 'Buchas' : 'Situação'}
                  </TableHead>
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
                                <span className="font-medium group-hover:underline">{user.apelido}</span>
                                {getMedalIcon(rank)}
                            </Link>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{sortColumnAccessor(user as any)}</TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                          {sortType === 'default' ? user.exatos : user.pontos}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell">
                           {sortType === 'situation' ? user.exatos : user.situacoes}
                        </TableCell>
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
