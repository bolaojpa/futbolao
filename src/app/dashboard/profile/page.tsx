

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Gamepad2, Percent, Star, Crown, Award, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { mockUser, mockChampionships } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string | number, description: string }) => (
    <Card>
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
)

const renderHonorifics = (count: number) => {
    if (count === 0) return null;

    let IconComponent: React.ComponentType<{ className?: string }> = Star;
    let displayCount = 0;
    let iconClass = "h-5 w-5 text-yellow-400";
    let isFilled = false;

    if (count >= 10) {
        IconComponent = Crown;
        displayCount = Math.min(count - 9, 3);
        isFilled = true;
    } else if (count >= 7) {
        IconComponent = Trophy;
        displayCount = Math.min(count - 6, 3);
        isFilled = true;
    } else if (count >= 4) {
        IconComponent = Award;
        displayCount = Math.min(count - 3, 3);
        isFilled = true;
    } else {
        IconComponent = Star;
        displayCount = Math.min(count, 3);
        isFilled = true;
    }
    
    const icons = Array.from({ length: displayCount }, (_, i) => (
        <IconComponent key={i} className={cn(iconClass, isFilled && "fill-yellow-400")} />
    ));

    return (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 h-6 rounded-full px-2">
            {icons}
        </div>
    );
};

export default function ProfilePage() {
  const { apelido, nome, email, fotoPerfil, titulos, totalCampeonatos, totalJogos, taxaAcerto, championshipStats } = mockUser;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();
  const [selectedChampionship, setSelectedChampionship] = useState<string>(mockChampionships[0].id);

  const generalStats = [
    { 
        icon: <Award className="h-4 w-4 text-muted-foreground" />,
        title: "Títulos",
        value: titulos,
        description: "Campeão da Pontuação Geral"
    },
    { 
        icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />,
        title: "Campeonatos Disputados",
        value: totalCampeonatos,
        description: "Total de competições participadas"
    },
    { 
        icon: <Edit className="h-4 w-4 text-muted-foreground" />,
        title: "Total de Palpites",
        value: totalJogos,
        description: "Palpites enviados em todos os tempos"
    },
    { 
        icon: <Percent className="h-4 w-4 text-muted-foreground" />,
        title: "Taxa de Acerto Geral",
        value: `${taxaAcerto}%`,
        description: "Percentual de palpites premiados"
    },
  ];

  const selectedChampionshipStats = championshipStats.find(stat => stat.championshipId === selectedChampionship);
  
  const championshipSpecificStats = selectedChampionshipStats ? [
    {
      icon: <Star className="h-4 w-4 text-muted-foreground" />,
      title: "Pontos",
      value: selectedChampionshipStats.pontos,
      description: "Total de pontos no campeonato"
    },
    {
      icon: <Target className="h-4 w-4 text-muted-foreground" />,
      title: "Acertos Exatos",
      value: selectedChampionshipStats.acertosExatos,
      description: "Placares cravados"
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />,
      title: "Acertos de Situação",
      value: selectedChampionshipStats.acertosSituacao,
      description: "Vencedor/empate corretos"
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      title: "Maior Sequência de Acertos",
      value: selectedChampionshipStats.maiorSequencia,
      description: "Sequência de placares exatos"
    },
  ] : [];


  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-2">
             <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={fotoPerfil} alt={`@${apelido}`} />
                    <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                </Avatar>
                {renderHonorifics(titulos)}
            </div>
        </div>
        <div className='flex-1 text-center md:text-left'>
            <h1 className="text-3xl font-bold font-headline">{nome}</h1>
            <p className="text-muted-foreground text-lg">@{apelido}</p>
            <p className="text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
        </Button>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Informações Gerais</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {generalStats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
      </div>
      
      <Separator />

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold font-headline">Minhas Estatísticas</h2>
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
