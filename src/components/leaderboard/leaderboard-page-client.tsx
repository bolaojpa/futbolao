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
import { Medal, Award, Flashlight, ArrowUp, ArrowDown, Minus, Trophy, Loader2, Gem, Goal, Ghost } from 'lucide-react';
import { Confetti } from '@/components/leaderboard/confetti';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Honorifics } from '@/components/shared/honorifics';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { useAuth } from '@/hooks/use-auth';
import { onSnapshot, collection } from 'firebase/firestore';
import { isPast, parseISO } from 'date-fns';
import { db } from '@/lib/firebase';

export function LeaderboardPageClient() {
  const { user: authUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const championshipIdFromQuery = searchParams.get('championshipId');
  
  type SortType = 'default' | 'exact' | 'situation' | 'combo' | 'bonus' | 'gols';

  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<SortType>('default');
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubChampionships = onSnapshot(collection(db, "championships"), (snap) => {
      const championshipsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Championship)).sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setChampionships(championshipsData);
    });
    
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserType)));
    });

    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
        setAllMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });

    const unsubPredictions = onSnapshot(collection(db, "predictions"), (snapshot) => {
        setAllPredictions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction)));
        setLoading(false);
    });

    return () => {
        unsubChampionships();
        unsubUsers();
        unsubMatches();
        unsubPredictions();
    };
  }, []);

  useEffect(() => {
    if (authLoading || !authUser || championships.length === 0) return;

    if (championshipIdFromQuery && championships.some(c => c.id === championshipIdFromQuery)) {
        setSelectedChampionshipId(championshipIdFromQuery);
    } else {
        const userChampionships = championships.filter(c => c.participantes.includes(authUser.id));
        if (userChampionships.length > 0) {
            const activeChampionship = userChampionships.find(c => c.status === 'ativo');
            setSelectedChampionshipId(activeChampionship ? activeChampionship.id : userChampionships[0].id);
        } else {
            setSelectedChampionshipId(null);
        }
    }
  }, [championships, championshipIdFromQuery, authUser, authLoading]);

  const calculateLivePoints = (match: Match, prediction: Prediction, championship: Championship | undefined): { pontos: number; exato: boolean; situacao: boolean; combo: boolean; bonus: boolean; gols: boolean; } => {
    const liveA = match.placarA ?? 0;
    const liveB = match.placarB ?? 0;
    const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
    
    if (guessA === null || guessB === null || !championship) {
      return { pontos: 0, exato: false, situacao: false, combo: false, bonus: false, gols: false };
    }

    const pontuacao = championship.pontuacao;
    
    const acertouPlacarExato = guessA === liveA && guessB === liveB;
    const finalWinner = liveA > liveB ? 'A' : liveA < liveB ? 'B' : 'E';
    const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
    const acertouSituacao = !acertouPlacarExato && finalWinner === guessWinner;
    
    let pontosGanhos = 0;
    let acertouCombo = false;
    let acertouBonus = false;
    let acertouGolsSozinho = false;

    const usouCombo = !!prediction.palpiteCombo;
    const totalGolsFinal = liveA + liveB;
    const acertouGols = usouCombo && pontuacao.combo?.ativo && prediction.palpiteCombo?.totalGols === totalGolsFinal;

    if (acertouPlacarExato) {
        pontosGanhos = pontuacao.tradicional.exato;
        if (acertouGols && pontuacao.combo?.ativo) {
            pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
            acertouCombo = true;
        }
    } else if (acertouSituacao) {
        pontosGanhos = pontuacao.tradicional.situacao;
        if (acertouGols && pontuacao.combo?.ativo) {
            pontosGanhos += pontuacao.combo.pontosGols;
            acertouBonus = true;
        }
    } else if (acertouGols && pontuacao.combo?.ativo) {
        pontosGanhos = pontuacao.combo.pontosGols;
        acertouGolsSozinho = true;
    }

    return { pontos: pontosGanhos, exato: acertouPlacarExato, situacao: acertouSituacao, combo: acertouCombo, bonus: acertouBonus, gols: acertouGolsSozinho };
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
      let baseGols = 0;

      const predictionsInChamp = allPredictions.filter(p => p.userId === user.id && allMatches.some(m => m.id === p.matchId && m.campeonatoId === selectedChampionshipId && m.status === 'Finalizado'));
      predictionsInChamp.forEach(p => {
            if (p.acertoTipo === 'combo') baseCombos++;
            if (p.acertoTipo === 'bonus') baseBonus++;
            if (p.acertoTipo === 'gols') baseGols++;
      })

      liveMatchesForChamp.forEach(match => {
          const prediction = allPredictions.find(p => p.matchId === match.id && p.userId === user.id);
          if (prediction) {
              const result = calculateLivePoints(match, prediction, selectedChampionship);
              basePoints += result.pontos;
              if (result.exato) baseExatos++;
              if (result.situacao) baseSituacoes++;
              if (result.combo) baseCombos++;
              if (result.bonus) baseBonus++;
              if (result.gols) baseGols++;
          }
      });

      return {
        ...user,
        pontos: basePoints,
        exatos: baseExatos,
        situacoes: baseSituacoes,
        combo: baseCombos,
        bonus: baseBonus,
        gols: baseGols,
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
                    if (a.situacoes !== b.situacoes) return b.situacoes - a.situacoes;
                    break;
                case 'primeiraBucha':
                    if (selectedChampionship?.pontuacao.tradicional) {
                        const maxPontos = selectedChampionship.pontuacao.tradicional.exato;
                        const buchasA = allPredictions.filter(p => p.userId === a.id && p.pontos === maxPontos).map(p => p.matchId);
                        const buchasB = allPredictions.filter(p => p.userId === b.id && p.pontos === maxPontos).map(p => p.matchId);

                        for (const match of championshipMatches) {
                            const aAcertou = buchasA.includes(match.id);
                            const bAcertou = buchasB.includes(match.id);
                            if (aAcertou && !bAcertou) return -1;
                            if (!aAcertou && bAcertou) return 1;
                        }
                    }
                    break;
            }
        }
        
        const dateAValue = a.dataCadastro instanceof Date ? a.dataCadastro.getTime() : new Date(a.dataCadastro as string).getTime();
        const dateBValue = b.dataCadastro instanceof Date ? b.dataCadastro.getTime() : new Date(b.dataCadastro as string).getTime();
        return dateAValue - dateBValue;
    });
  }, [usersWithStatsForChampionship, selectedChampionshipId, selectedChampionship, allMatches, allPredictions]);

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
      case 'gols':
        return { header: 'Gols', accessor: (user: any) => user.gols };
      default:
        return { header: 'Pontos', accessor: (user: any) => user.pontos };
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
      case 'up': return { icon: <ArrowUp className="w-4 h-4 text-green-500" />, tooltip: 'Subiu de posição' };
      case 'down': return { icon: <ArrowDown className="w-4 h-4 text-destructive" />, tooltip: 'Desceu de posição' };
      default: return { icon: <Minus className="w-4 h-4 text-primary" />, tooltip: 'Posição estável' };
    }
  };
  
  if (authLoading || loading) {
      return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  const userChampionshipOptions = championships.filter(c => authUser && c.participantes.includes(authUser.id));
  const leader = sortedTableUsers.length > 0 ? sortedTableUsers[0] : null;


  return (
    <TooltipProvider>
      <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
        <Confetti />
        <div className="flex items-center gap-4 mb-8">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Ranking de Jogadores</h1>
                <p className="text-muted-foreground">Veja quem são os mestres dos palpites.</p>
            </div>
        </div>

        {userChampionshipOptions.length > 0 && selectedChampionshipId ? (
            <>
                <div className="w-full md:w-auto mb-8">
                    <Select value={selectedChampionshipId} onValueChange={setSelectedChampionshipId}>
                        <SelectTrigger className="w-full md:w-[280px]">
                            <SelectValue placeholder="Filtrar por campeonato" />
                        </SelectTrigger>
                        <SelectContent>
                            {userChampionshipOptions.map(champ => (
                                <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                 {leader && (
                    <div className="text-center mb-8">
                        <Card key={leader.id} className="relative overflow-hidden inline-block">
                            <CardHeader>
                                <Link href={`/dashboard/profile?userId=${leader.id}`} className="block w-fit mx-auto">
                                <div className="w-24 h-24 rounded-full mx-auto p-1 bg-gradient-to-tr from-yellow-400 to-amber-600 animate-leader-pulse">
                                    <Avatar className="w-full h-full border-4 border-background">
                                        <AvatarImage src={leader.fotoPerfil} alt={leader.apelido} />
                                        <AvatarFallback>{leader.apelido.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                </div>
                                </Link>
                                <CardTitle className="mt-4 text-2xl font-headline">
                                    <Link href={`/dashboard/profile?userId=${leader.id}`} className="hover:underline">
                                        {leader.apelido}
                                    </Link>
                                </CardTitle>
                                <CardDescription className="text-lg font-bold text-primary">{leader.pontos} pts</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-center text-3xl">
                                    <Medal className="w-10 h-10 text-yellow-500 fill-yellow-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold font-headline">Classificação Geral</h3>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Select value={sortType} onValueChange={(v) => setSortType(v as SortType)}>
                            <SelectTrigger className="w-full md:w-[240px]">
                                <SelectValue placeholder="Critério de Ordenação" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Ordenar por Pontos (Padrão)</SelectItem>
                                <SelectItem value="exact">Ordenar por Buchas</SelectItem>
                                <SelectItem value="situation">Ordenar por Situação</SelectItem>
                                {selectedChampionship?.pontuacao.combo?.ativo && (
                                    <>
                                        <SelectItem value="combo">Ordenar por Combo</SelectItem>
                                        <SelectItem value="bonus">Ordenar por Bônus</SelectItem>
                                        <SelectItem value="gols">Ordenar por Gols</SelectItem>
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
                          <TableHead className='w-10 px-2 text-center'>Pos.</TableHead>
                          <TableHead className='w-10 px-2 text-center'>Var.</TableHead>
                          <TableHead>Jogador</TableHead>
                          <TableHead className="text-right">{sortColumnHeader}</TableHead>
                          {sortType !== 'exact' && <TableHead className="text-right hidden md:table-cell">Buchas</TableHead>}
                          {sortType !== 'situation' && <TableHead className="text-right hidden md:table-cell">Situação</TableHead>}
                          {selectedChampionship?.pontuacao.combo?.ativo && (
                            <>
                              {sortType !== 'combo' && <TableHead className="text-right hidden md:table-cell">Combo</TableHead>}
                              {sortType !== 'bonus' && <TableHead className="text-right hidden md:table-cell">Bônus</TableHead>}
                              {sortType !== 'gols' && <TableHead className="text-right hidden md:table-cell">Gols</TableHead>}
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
                                    authUser?.id === user.id && "bg-blue-100/50 dark:bg-blue-900/20",
                                    rank === 1 && "bg-gradient-to-r from-yellow-400/20 via-yellow-300/10 to-yellow-400/20 dark:from-yellow-500/20 dark:via-yellow-400/10 dark:to-yellow-500/20"
                                )}
                            >
                                <TableCell className="font-medium text-center px-2">{rank}º</TableCell>
                                <TableCell className="text-center px-2">
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
                                    <Link href={`/dashboard/profile?userId=${user.id}`} className="flex items-center gap-1.5 group">
                                        <div className="relative">
                                            <Avatar className="w-9 h-9">
                                            <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                            <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                            <Honorifics count={user.titulos ?? 0} variant="badge" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium group-hover:underline break-words">{user.apelido || user.nome}</span>
                                            {user.isGhost && <Ghost className="w-4 h-4 text-primary" />}
                                        </div>
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
                                    {sortType !== 'gols' && <TableCell className="text-right hidden md:table-cell">{user.gols}</TableCell>}
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
            </>
        ) : (
            <Card>
                <CardContent className="p-10 text-center">
                    <div className="mx-auto w-fit bg-muted p-4 rounded-full mb-4">
                        <Trophy className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold">Nenhum Campeonato para Exibir</h3>
                    <p className="text-muted-foreground mt-2">
                        Você ainda não foi adicionado a nenhum campeonato.
                        <br />
                        Peça a um administrador para incluí-lo e volte para ver o ranking.
                    </p>
                </CardContent>
            </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
