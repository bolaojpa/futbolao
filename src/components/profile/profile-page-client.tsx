

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Gamepad2, Percent, Target, XCircle, CheckCircle, Heart, Clock, Goal, Trophy, Users, LogIn, HelpCircle, Loader2, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Honorifics } from '@/components/shared/honorifics';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { HonorificsExplanationModal } from '@/components/profile/honorifics-explanation-modal';
import type { UserType, Championship, Match, Prediction } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getChampionships } from '@/lib/firebase/firestore';

const TimeAgo = ({ dateValue }: { dateValue: string | Date | Timestamp | undefined | null }) => {
    const [timeAgo, setTimeAgo] = useState('');
    useEffect(() => {
        if (!dateValue) {
            setTimeAgo("nunca");
            return;
        };

        let date: Date;
        if (dateValue instanceof Timestamp) {
            date = dateValue.toDate();
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else {
            date = dateValue;
        }

        if (date && !isNaN(date.getTime())) {
            setTimeAgo(formatDistanceToNow(date, { addSuffix: true, locale: ptBR }));
        } else {
            setTimeAgo("data inválida")
        }
    }, [dateValue]);

    if (!timeAgo) return null;
    return <>{timeAgo}</>;
};

type StatCardVariant = 'default' | 'exact' | 'situation' | 'combo' | 'bonus' | 'gols' | 'error' | 'leader';

const StatCard = ({ 
    icon, 
    title, 
    value, 
    description, 
    href, 
    variant = 'default' 
}: { 
    icon: React.ReactNode, 
    title: string, 
    value: string | number, 
    description: string, 
    href?: string, 
    variant?: StatCardVariant 
}) => {
    const variantClasses: Record<StatCardVariant, string> = {
        default: 'hover:bg-muted/50',
        leader: 'bg-green-500/10 border-green-500/50 shadow-lg hover:bg-green-500/20',
        exact: 'bg-bucha-solid text-white hover:brightness-110',
        situation: 'bg-situacao-solid text-white hover:brightness-110',
        combo: 'bg-combo-gold text-black hover:brightness-110',
        bonus: 'bg-combo-silver text-black hover:brightness-110',
        gols: 'bg-gols-solid text-white hover:brightness-110',
        error: 'bg-erro-solid text-white hover:brightness-110',
    };
    
    const descriptionClasses = {
        exact: 'text-white/80',
        situation: 'text-white/80',
        combo: 'text-black/80',
        bonus: 'text-black/80',
        gols: 'text-white/80',
        error: 'text-white/80',
    }

    const cardContent = (
         <Card className={cn(
            "transition-all duration-200",
             href && "cursor-pointer",
             variantClasses[variant]
         )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <p className={cn("text-xs text-muted-foreground truncate", descriptionClasses[variant as keyof typeof descriptionClasses])}>
                            {description}
                        </p>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{description}</p>
                    </TooltipContent>
                </Tooltip>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{cardContent}</Link>;
    }
    
    return cardContent;
}

export function ProfilePageClient() {
  const { user: authUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');
  
  const [userToDisplay, setUserToDisplay] = useState<UserType | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = userIdFromQuery || authUser?.id;
  const isOwnProfile = !userIdFromQuery || userIdFromQuery === authUser?.id;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    
    const fetchStaticData = async () => {
        try {
            const champs = await getChampionships();
            setChampionships(champs);
        } catch (error) {
            console.error("Failed to fetch static data for profile", error);
        }
    };
    
    fetchStaticData();

    const unsubUser = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        setUserToDisplay({ id: doc.id, ...doc.data() } as UserType);
      } else {
        setUserToDisplay(null);
      }
      setLoading(false);
    });
    
    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
        setAllMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
    });

    const predictionsQuery = query(collection(db, 'predictions'), where('userId', '==', userId));
    const unsubPredictions = onSnapshot(predictionsQuery, (snapshot) => {
        const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Prediction }));
        setUserPredictions(preds);
    });

    return () => {
        unsubUser();
        unsubMatches();
        unsubPredictions();
    };
  }, [userId]);
  
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | undefined>(undefined);

   useEffect(() => {
    if (championships.length > 0 && !selectedChampionshipId) {
        const activeChampionship = championships.find(c => c.status === 'ativo');
        setSelectedChampionshipId(activeChampionship ? activeChampionship.id : championships[0]?.id);
    }
  }, [championships, selectedChampionshipId]);

  const calculateLivePoints = (match: Match, prediction: Prediction, championship: Championship | undefined): { pontos: number; acertoTipo: Prediction['acertoTipo'] } => {
    const liveA = match.placarA ?? 0;
    const liveB = match.placarB ?? 0;
    const { placarA: guessA, placarB: guessB } = prediction.palpiteUsuario;
    
    if (guessA === null || guessB === null || !championship) {
      return { pontos: 0, acertoTipo: 'erro' };
    }

    const pontuacao = championship.pontuacao;
    
    const acertouPlacarExato = guessA === liveA && guessB === liveB;
    const finalWinner = liveA > liveB ? 'A' : liveA < liveB ? 'B' : 'E';
    const guessWinner = guessA > guessB ? 'A' : guessA < guessB ? 'B' : 'E';
    const acertouSituacao = finalWinner === guessWinner;
    
    let pontosGanhos = 0;
    let acertoTipo: Prediction['acertoTipo'] = 'erro';

    const usouCombo = !!prediction.palpiteCombo;
    const totalGolsFinal = liveA + liveB;
    const acertouGols = usouCombo && pontuacao.combo?.ativo && prediction.palpiteCombo?.totalGols === totalGolsFinal;

    if (acertouPlacarExato) {
        pontosGanhos = pontuacao.tradicional.exato;
        acertoTipo = 'bucha';
        if (acertouGols && pontuacao.combo?.ativo) {
            pontosGanhos += pontuacao.combo.bonusPlacarExatoGols;
            acertoTipo = 'combo';
        }
    } else if (acertouSituacao) {
        pontosGanhos = pontuacao.tradicional.situacao;
        acertoTipo = 'situacao';
        if (acertouGols && pontuacao.combo?.ativo) {
            pontosGanhos += pontuacao.combo.pontosGols;
            acertoTipo = 'bonus';
        }
    } else if (acertouGols && pontuacao.combo?.ativo) {
        pontosGanhos = pontuacao.combo.pontosGols;
        acertoTipo = 'gols';
    }

    return { pontos: pontosGanhos, acertoTipo };
  };

  const selectedChampionship = useMemo(() => championships.find(c => c.id === selectedChampionshipId), [championships, selectedChampionshipId]);

  const selectedChampionshipStats = useMemo(() => {
    if (!userToDisplay || !selectedChampionshipId || !championships) {
      return { pontos: 0, acertosExatos: 0, acertosSituacao: 0, combo: 0, bonus: 0, gols: 0, erros: 0 };
    }

    const champ = championships.find(c => c.id === selectedChampionshipId);
    if (!champ) return { pontos: 0, acertosExatos: 0, acertosSituacao: 0, combo: 0, bonus: 0, gols: 0, erros: 0 };
    
    // Stats de partidas finalizadas
    const baseStats = userToDisplay.championshipStats?.find(s => s.championshipId === selectedChampionshipId) || { pontos: 0, acertosExatos: 0, acertosSituacao: 0 };
    let finalCombos = 0;
    let finalBonus = 0;
    let finalGols = 0;
    
    const finalizedPredictionsInChampionship = userPredictions.filter(p => {
        const match = allMatches.find(m => m.id === p.matchId);
        return match?.campeonatoId === selectedChampionshipId && match?.status === 'Finalizado';
    });

    finalizedPredictionsInChampionship.forEach(p => {
        if (p.acertoTipo === 'combo') finalCombos++;
        if (p.acertoTipo === 'bonus') finalBonus++;
        if (p.acertoTipo === 'gols') finalGols++;
    });
    
    // Stats de partidas ao vivo
    const liveMatchesForChamp = allMatches.filter(match => 
        match.campeonatoId === selectedChampionshipId &&
        match.status !== 'Finalizado' && 
        match.status !== 'Cancelado' &&
        isPast(parseISO(match.data))
    );

    let livePoints = 0;
    let liveExatos = 0;
    let liveSituacoes = 0;
    let liveCombos = 0;
    let liveBonus = 0;
    let liveGols = 0;

    liveMatchesForChamp.forEach(match => {
        const prediction = userPredictions.find(p => p.matchId === match.id);
        if (prediction) {
            const result = calculateLivePoints(match, prediction, champ);
            livePoints += result.pontos;
            if (result.acertoTipo === 'bucha' || result.acertoTipo === 'combo') liveExatos++;
            if (result.acertoTipo === 'situacao' || result.acertoTipo === 'bonus') liveSituacoes++;
            if (result.acertoTipo === 'combo') liveCombos++;
            if (result.acertoTipo === 'bonus') liveBonus++;
            if (result.acertoTipo === 'gols') liveGols++;
        }
    });

    const totalPontos = (baseStats.pontos || 0) + livePoints;
    const totalExatos = (baseStats.acertosExatos || 0) + liveExatos;
    const totalSituacoes = (baseStats.acertosSituacao || 0) + liveSituacoes;
    const totalCombos = finalCombos + liveCombos;
    const totalBonus = finalBonus + liveBonus;
    const totalGols = finalGols + liveGols;
    const totalAcertos = totalExatos + totalSituacoes;
    const totalErros = finalizedPredictionsInChampionship.length - totalAcertos;


    return {
        pontos: totalPontos,
        acertosExatos: totalExatos,
        acertosSituacao: totalSituacoes,
        combo: totalCombos,
        bonus: totalBonus,
        gols: totalGols,
        erros: totalErros > 0 ? totalErros : 0,
    };

  }, [userToDisplay, selectedChampionshipId, userPredictions, allMatches, championships]);


  const generalStats = useMemo(() => {
    if (!userToDisplay) return [];

    const finalizedPredictions = userPredictions.filter(p => {
        const match = allMatches.find(m => m.id === p.matchId);
        return match && match.status === 'Finalizado';
    });

    const playedChampionshipIds = new Set(
        finalizedPredictions.map(p => {
            const match = allMatches.find(m => m.id === p.matchId);
            return match?.campeonatoId;
        }).filter(Boolean)
    );
    
    const playedChampionships = playedChampionshipIds.size;
    const totalPalpites = new Set(finalizedPredictions.map(p => p.matchId)).size;
    const totalTitulos = userToDisplay.titulos || 0;

    return [
      { icon: <Trophy className="h-4 w-4 text-muted-foreground" />, title: "Títulos Conquistados", value: totalTitulos, description: "Total de campeonatos vencidos" },
      { icon: <Users className="h-4 w-4 text-muted-foreground" />, title: "Campeonatos Disputados", value: playedChampionships, description: "Campeonatos com palpites finalizados" },
      { icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />, title: "Total de Palpites", value: totalPalpites, description: "Jogos finalizados com palpites enviados" },
    ];
  }, [userToDisplay, allMatches, userPredictions]);


  const lastGuessMatch = useMemo(() => {
      if (!userToDisplay?.ultimoPalpite?.matchId) return null;
      return allMatches.find(m => m.id === userToDisplay.ultimoPalpite.matchId);
  }, [userToDisplay, allMatches]);

  const getLastGuessLink = () => {
    if (!lastGuessMatch) return '#';
    const championshipForMatch = championships.find(c => c.id === lastGuessMatch.campeonatoId);

    switch(lastGuessMatch.status) {
      case 'Agendado': return `/dashboard/predictions#${lastGuessMatch.id}`;
      case 'Ao Vivo': return `/dashboard#${lastGuessMatch.id}`;
      case 'Finalizado':
         if (championshipForMatch) {
            return `/dashboard/history?championshipId=${championshipForMatch.id}&matchId=${lastGuessMatch.id}`;
          }
          return `/dashboard/history#${lastGuessMatch.id}`;
      default: return '#';
    }
  };
  
  if (loading || authLoading) {
      return <div className="p-8 flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  if (!userToDisplay) {
     return <div className="p-8 text-center">Usuário não encontrado.</div>;
  }

  const { 
    nome, apelido, fotoPerfil, urlImagemPersonalizada, titulos,
    timeCoracao, ultimaAtividade, ultimoLogin, 
    ultimoPalpite, presenceStatus 
  } = userToDisplay;
  
  const displayName = apelido || nome;
  const displayImage = urlImagemPersonalizada || fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const fallbackInitials = displayName ? displayName.substring(0, 2).toUpperCase() : '';

  return (
    <TooltipProvider>
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
                <Card>
                    <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-primary">
                                <AvatarImage src={displayImage} alt={displayName} />
                                <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                            </Avatar>
                            <StatusIndicator status={presenceStatus} className="w-6 h-6 border-2 top-0 right-0" />
                            <Honorifics count={titulos || 0} variant="default"/>
                            <HonorificsExplanationModal>
                                <Button variant="outline" size="icon" className="absolute bottom-0 -right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm">
                                <HelpCircle className="w-4 h-4" />
                                </Button>
                            </HonorificsExplanationModal>
                        </div>
                        <div className='flex-1 text-center md:text-left'>
                            <h1 className="text-3xl font-bold font-headline">{displayName}</h1>
                            <p className="text-muted-foreground text-lg">{nome}</p>
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-2">
                                {timeCoracao && (
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <Heart className='w-4 h-4 text-destructive/80 fill-destructive/50' />
                                        <span>{timeCoracao}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <Button asChild variant="outline">
                            <Link href="/dashboard/profile/edit">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar Perfil
                            </Link>
                            </Button>
                        )}
                    </div>
                    </CardContent>
                    {isOwnProfile && (
                        <CardFooter className="flex flex-col sm:flex-row flex-wrap items-start justify-start gap-x-6 gap-y-2 p-4 bg-muted/50 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <LogIn className="w-4 h-4" />
                                <span>
                                    Último login: <TimeAgo dateValue={ultimoLogin} />
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Última atividade: <TimeAgo dateValue={ultimaAtividade} />
                                </span>
                            </div>
                            {lastGuessMatch && (
                                <Link href={getLastGuessLink()} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Goal className="w-4 h-4" />
                                    <span>
                                        Último palpite ({ultimoPalpite?.palpite}): <strong className="group-hover:underline">{lastGuessMatch.timeA} vs {lastGuessMatch.timeB}</strong>
                                    </span>
                                </Link>
                            )}
                        </CardFooter>
                    )}
                </Card>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">Informações Gerais</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {generalStats.map(stat => <StatCard key={stat.title} {...stat} />)}
                    </div>
                </div>
                
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold font-headline">Estatísticas por Campeonato</h2>
                        <div className="w-full md:w-auto">
                            <Select value={selectedChampionshipId} onValueChange={setSelectedChampionshipId}>
                                <SelectTrigger className="w-full md:w-[280px]">
                                    <SelectValue placeholder="Filtrar por campeonato" />
                                </SelectTrigger>
                                <SelectContent>
                                    {championships.map(champ => (
                                        <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {userPredictions.some(p => allMatches.find(m => m.id === p.matchId)?.campeonatoId === selectedChampionshipId) ? (
                     <div className={cn("grid gap-4 sm:grid-cols-2", selectedChampionship?.pontuacao.combo?.ativo ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4")}>
                        <StatCard 
                            icon={<Gamepad2 className="h-4 w-4 text-muted-foreground" />} 
                            title="Pontos" 
                            value={selectedChampionshipStats.pontos} 
                            description="Total de pontos no campeonato" 
                            href={`/dashboard/leaderboard?championshipId=${selectedChampionshipId}`}
                            variant='default'
                        />
                        <StatCard 
                            icon={<Target className="h-4 w-4" />} 
                            title="Buchas" 
                            value={selectedChampionshipStats.acertosExatos} 
                            description="Placares cravados" 
                            href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=exact`}
                            variant='exact'
                        />
                         <StatCard 
                            icon={<CheckCircle className="h-4 w-4" />} 
                            title="Situação" 
                            value={selectedChampionshipStats.acertosSituacao} 
                            description="Vencedor/empate corretos" 
                            href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=situation`}
                            variant='situation'
                        />
                        {selectedChampionship?.pontuacao.combo?.ativo && (
                            <>
                                <StatCard
                                    icon={<Gem className="h-4 w-4" />}
                                    title="Combo"
                                    value={selectedChampionshipStats.combo}
                                    description="Bucha + Gols"
                                    href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=combo`}
                                    variant='combo'
                                />
                                <StatCard
                                    icon={<Trophy className="h-4 w-4" />}
                                    title="Bônus"
                                    value={selectedChampionshipStats.bonus}
                                    description="Situação + Gols"
                                    href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=bonus`}
                                    variant='bonus'
                                />
                                <StatCard
                                    icon={<Goal className="h-4 w-4" />}
                                    title="Gols"
                                    value={selectedChampionshipStats.gols}
                                    description="Acerto apenas nos gols"
                                    href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=gols`}
                                    variant='gols'
                                />
                            </>
                        )}
                        <StatCard 
                            icon={<XCircle className="h-4 w-4" />} 
                            title="Erros" 
                            value={selectedChampionshipStats.erros} 
                            description="Palpites sem pontuação" 
                            href={`/dashboard/history?championshipId=${selectedChampionshipId}&filterType=miss`}
                            variant='error'
                        />
                     </div>
                    ) : (
                    <Card>
                        <CardContent className="p-6 text-center">
                        <p>Nenhuma estatística encontrada para este campeonato.</p>
                        </CardContent>
                    </Card>
                    )}
                </div>
            </div>
        </div>
    </TooltipProvider>
  );
}
