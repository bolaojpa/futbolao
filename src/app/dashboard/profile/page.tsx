

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Gamepad2, Percent, Target, TrendingUp, CheckCircle, Heart, Clock, Goal, Trophy, Users } from 'lucide-react';
import { mockUser, mockUsers, mockChampionships, mockMatches } from '@/lib/data';
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
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true)
  }, []);

  const userToDisplay = useMemo(() => {
    if (!userId || userId === mockUser.id) {
        return mockUser;
    }
    return mockUsers.find(u => u.id === userId) || mockUser;
  }, [userId]);
  
  const [selectedChampionship, setSelectedChampionship] = useState<string>(mockChampionships[0].id);

  const isOwnProfile = userToDisplay.id === mockUser.id;

  const { 
    nome, 
    apelido, 
    fotoPerfil, 
    urlImagemPersonalizada,
    titulos, 
    totalJogos, 
    championshipStats,
    timeCoracao,
    ultimaAtividade,
    ultimoPalpite
  } = userToDisplay as typeof mockUser; // Cast to include all fields
  
  const displayName = apelido || nome;
  const displayImage = urlImagemPersonalizada || fotoPerfil;
  const fallbackInitials = displayName.substring(0, 2).toUpperCase();

  const selectedChampionshipStats = championshipStats.find(stat => stat.championshipId === selectedChampionship);

  const championshipLeaders = useMemo(() => {
    const statsForChamp = mockUsers.map(u => u.championshipStats.find(cs => cs.championshipId === selectedChampionship)).filter(Boolean);

    if (statsForChamp.length === 0) {
      return { maxPoints: 0, maxExacts: 0, maxSituations: 0, maxStreak: 0 };
    }

    const maxPoints = Math.max(...statsForChamp.map(s => s!.pontos));
    const maxExacts = Math.max(...statsForChamp.map(s => s!.acertosExatos));
    const maxSituations = Math.max(...statsForChamp.map(s => s!.acertosSituacao));
    const maxStreak = Math.max(...statsForChamp.map(s => s!.maiorSequencia));

    return { maxPoints, maxExacts, maxSituations, maxStreak };
  }, [selectedChampionship]);
  
  if (!isClient) {
      return <div>Carregando perfil...</div>; // Or a skeleton loader
  }

  const generalStats = [
    { 
        icon: <Trophy className="h-4 w-4 text-muted-foreground" />,
        title: "Títulos Conquistados",
        value: titulos,
        description: "Total de campeonatos vencidos"
    },
    {
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      title: "Campeonatos Disputados",
      value: championshipStats.length,
      description: "Total de campeonatos que participou"
    },
    { 
        icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />,
        title: "Total de Palpites",
        value: totalJogos,
        description: "Palpites enviados em todos os tempos"
    },
  ];

  const championshipSpecificStats = selectedChampionshipStats ? [
    {
      icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />,
      title: "Pontos",
      value: selectedChampionshipStats.pontos,
      description: "Total de pontos no campeonato",
      href: `/dashboard/leaderboard?championshipId=${selectedChampionship}`,
      isLeader: selectedChampionshipStats.pontos === championshipLeaders.maxPoints && selectedChampionshipStats.pontos > 0,
    },
    {
      icon: <Target className="h-4 w-4 text-muted-foreground" />,
      title: "Acertos Exatos",
      value: selectedChampionshipStats.acertosExatos,
      description: "Placares cravados",
      href: `/dashboard/history?championshipId=${selectedChampionship}&filterType=exact`,
      isLeader: selectedChampionshipStats.acertosExatos === championshipLeaders.maxExacts && selectedChampionshipStats.acertosExatos > 0,
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      title: "Acertos de Situação",
      value: selectedChampionshipStats.acertosSituacao,
      description: "Vencedor/empate corretos",
      href: `/dashboard/history?championshipId=${selectedChampionship}&filterType=situation`,
      isLeader: selectedChampionshipStats.acertosSituacao === championshipLeaders.maxSituations && selectedChampionshipStats.acertosSituacao > 0,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      title: "Maior Sequência de Acertos",
      value: selectedChampionshipStats.maiorSequencia,
      description: "Sequência de placares exatos",
      isLeader: selectedChampionshipStats.maiorSequencia === championshipLeaders.maxStreak && selectedChampionshipStats.maiorSequencia > 0,
    },
  ] : [];

  const lastGuessMatch = [...mockMatches.upcoming, ...mockMatches.recent].find(m => m.id === ultimoPalpite.matchId);

  return (
    <div className="container mx-auto space-y-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={displayImage} alt={displayName} />
                    <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                </Avatar>
                <Honorifics count={titulos} variant="default"/>
            </div>
            <div className='flex-1 text-center md:text-left'>
                <h1 className="text-3xl font-bold font-headline">{displayName}</h1>
                {apelido && <p className="text-muted-foreground text-lg">{nome}</p>}
                {timeCoracao && (
                    <div className='flex items-center justify-center md:justify-start gap-2 mt-2 text-muted-foreground'>
                        <Heart className='w-4 h-4 text-destructive/80 fill-destructive/50' />
                        <span>{timeCoracao}</span>
                    </div>
                )}
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
            <CardFooter className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                        Última atividade: {formatDistanceToNow(new Date(ultimaAtividade), { addSuffix: true, locale: ptBR })}
                    </span>
                </div>
                <Separator orientation='vertical' className='h-6 hidden sm:block' />
                {lastGuessMatch && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Goal className="w-4 h-4" />
                        <span>
                            Último palpite ({ultimoPalpite.palpite}): <strong>{lastGuessMatch.timeA} vs {lastGuessMatch.timeB}</strong>
                        </span>
                     </div>
                )}
            </CardFooter>
        )}
      </Card>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Informações Gerais</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {generalStats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
      </div>
      
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold font-headline">Estatísticas por Campeonato</h2>
            <div className="w-full md:w-auto">
                <Select value={selectedChampionship} onValueChange={setSelectedChampionship}>
                    <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="Filtrar por campeonato" />
                    </SelectTrigger>
                    <SelectContent>
                        {mockChampionships.map(champ => (
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
  );
}

