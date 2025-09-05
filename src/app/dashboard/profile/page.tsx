
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Gamepad2, Percent, Target, TrendingUp, CheckCircle, Heart, Clock, Goal, Trophy, Users, LogIn, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Honorifics } from '@/components/shared/honorifics';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { HonorificsExplanationModal } from '@/components/profile/honorifics-explanation-modal';
import type { UserType, Championship, Match } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getChampionships, getMatches } from '@/lib/firebase/firestore';

const TimeAgo = ({ dateString }: { dateString: string }) => {
    const [timeAgo, setTimeAgo] = useState('');
    useEffect(() => {
        if (dateString) {
            setTimeAgo(formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR }))
        }
    }, [dateString]);
    if (!timeAgo) return null;
    return <>{timeAgo}</>;
};

const StatCard = ({ icon, title, value, description, href, isLeader }: { icon: React.ReactNode, title: string, value: string | number, description: string, href?: string, isLeader?: boolean }) => {
    const cardContent = (
         <Card className={cn(
            "transition-all duration-200",
             href && "hover:bg-muted/80 hover:shadow-md cursor-pointer",
             isLeader && "bg-green-500/10 border-green-500/50 shadow-lg"
         )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );

    if (href) {
        return <Link href={href} className="block">{cardContent}</Link>;
    }
    
    return cardContent;
}

export default function ProfilePage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const userIdFromQuery = searchParams.get('userId');
  const [userToDisplay, setUserToDisplay] = useState<UserType | null>(null);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = userIdFromQuery || authUser?.id;
  const isOwnProfile = !userIdFromQuery || userIdFromQuery === authUser?.id;

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    
    // Fetch static data
    Promise.all([getChampionships(), getMatches()]).then(([champs, matchData]) => {
      setChampionships(champs);
      setMatches(matchData);
    });

    // Listen for real-time user updates
    const unsub = onSnapshot(doc(db, "users", userId), (doc) => {
      if (doc.exists()) {
        setUserToDisplay({ id: doc.id, ...doc.data() } as UserType);
      } else {
        setUserToDisplay(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);
  
  const [selectedChampionshipId, setSelectedChampionshipId] = useState<string | undefined>(undefined);

   useEffect(() => {
    if (championships.length > 0 && !selectedChampionshipId) {
        const activeChampionship = championships.find(c => c.status === 'ativo');
        setSelectedChampionshipId(activeChampionship ? activeChampionship.id : championships[0].id);
    }
  }, [championships, selectedChampionshipId]);


  const selectedChampionshipStats = useMemo(() => {
    if (!userToDisplay || !selectedChampionshipId) {
        return {
            pontos: 0,
            acertosExatos: 0,
            acertosSituacao: 0,
            maiorSequencia: 0,
        };
    };
    return userToDisplay.championshipStats?.find(stat => stat.championshipId === selectedChampionshipId) || {
        pontos: 0,
        acertosExatos: 0,
        acertosSituacao: 0,
        maiorSequencia: 0,
    };
  }, [userToDisplay, selectedChampionshipId]);

  const lastGuessMatch = useMemo(() => {
      if (!userToDisplay?.ultimoPalpite?.matchId) return null;
      return matches.find(m => m.id === userToDisplay.ultimoPalpite.matchId);
  }, [userToDisplay, matches]);


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
    nome, apelido, fotoPerfil, urlImagemPersonalizada, titulos, totalJogos, 
    championshipStats, timeCoracao, ultimaAtividade, ultimoLogin, 
    ultimoPalpite, presenceStatus 
  } = userToDisplay;
  
  const displayName = apelido || nome;
  const displayImage = urlImagemPersonalizada || fotoPerfil;
  const fallbackInitials = displayName ? displayName.substring(0, 2).toUpperCase() : '';

  const generalStats = [
    { icon: <Trophy className="h-4 w-4 text-muted-foreground" />, title: "Títulos Conquistados", value: titulos || 0, description: "Total de campeonatos vencidos" },
    { icon: <Users className="h-4 w-4 text-muted-foreground" />, title: "Campeonatos Disputados", value: championshipStats?.length || 0, description: "Total de campeonatos que participou" },
    { icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />, title: "Total de Palpites", value: totalJogos || 0, description: "Palpites enviados em todos os tempos" },
  ];

  const championshipSpecificStats = [
    { icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />, title: "Pontos", value: selectedChampionshipStats.pontos, description: "Total de pontos no campeonato", href: `/dashboard/leaderboard?championshipId=${selectedChampionshipId}`},
    { icon: <Target className="h-4 w-4 text-muted-foreground" />, title: "Acertos Exatos", value: selectedChampionshipStats.acertosExatos, description: "Placares cravados", href: `/dashboard/history?championshipId=${selectedChampionshipId}&filterType=exact`},
    { icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />, title: "Acertos de Situação", value: selectedChampionshipStats.acertosSituacao, description: "Vencedor/empate corretos", href: `/dashboard/history?championshipId=${selectedChampionshipId}&filterType=situation`},
    { icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />, title: "Maior Sequência de Acertos", value: selectedChampionshipStats.maiorSequencia, description: "Sequência de placares exatos"},
  ];

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
                                    Último login: {ultimoLogin && <TimeAgo dateString={ultimoLogin} />}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Última atividade: {ultimaAtividade && <TimeAgo dateString={ultimaAtividade} />}
                                </span>
                            </div>
                            {lastGuessMatch && (
                                <Link href={getLastGuessLink()} className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                                    <Goal className="w-4 h-4" />
                                    <span>
                                        Último palpite ({ultimoPalpite.palpite}): <strong className="group-hover:underline">{lastGuessMatch.timeA} vs {lastGuessMatch.timeB}</strong>
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
                    {selectedChampionshipStats ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {championshipSpecificStats.map(stat => <StatCard key={stat.title} {...stat} />)}
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
