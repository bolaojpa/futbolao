
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { mockUser, mockMatches, mockPredictions, mockUsers } from '@/lib/data';
import { format, parseISO, isToday, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, History, Zap, AlarmClock, Medal, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Countdown } from '@/components/shared/countdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DashboardPage() {
  const { apelido } = mockUser;
  
  const liveMatches = mockMatches.upcoming.filter(match => match.status === 'Ao Vivo');
  const upcomingMatches = mockMatches.upcoming.filter(match => match.status !== 'Ao Vivo').sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sortedUsers = [...mockUsers].sort((a, b) => {
    if (a.pontos !== b.pontos) return b.pontos - a.pontos;
    if (a.exatos !== b.exatos) return b.exatos - a.exatos;
    if (a.tempoMedio !== b.tempoMedio) return a.tempoMedio - b.tempoMedio;
    return new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
  });
  const leader = sortedUsers[0];


  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    if (status === 'Ao Vivo') return 'destructive';
    if (status === 'Agendado') return 'secondary';
    return 'default';
  };

  const getPredictionStatusClass = (pontos: number) => {
    if (pontos === 10) return 'bg-green-100/80 dark:bg-green-900/40'; // Acerto exato
    if (pontos > 0) return 'bg-blue-100/80 dark:bg-blue-900/40';   // Acerto de situação
    return 'bg-red-100/80 dark:bg-red-900/40';       // Erro
  }
  
  const getPointsBadgeVariant = (pontos: number): "default" | "secondary" | "destructive" => {
    if (pontos === 10) return 'default';
    if (pontos > 0) return 'secondary';
    return 'destructive';
  }
  
  const UpcomingMatchDate = ({ matchDateString }: { matchDateString: string }) => {
    if (!isClient) {
      return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>Carregando...</div>;
    }
    const matchDate = parseISO(matchDateString);
    const now = new Date();
    const hoursDiff = differenceInHours(matchDate, now);

    if (hoursDiff < 1) {
      return (
         <div className="text-xs font-semibold text-accent flex items-center justify-center gap-2">
           <AlarmClock className="w-4 h-4"/>
           <Countdown targetDate={matchDateString} />
        </div>
      )
    }

    if (hoursDiff < 2) {
      return (
        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
          <AlarmClock className="w-3 h-3"/>
          {`Em breve às ${format(matchDate, "HH:mm", { locale: ptBR })}`}
        </div>
      );
    }
    
    if (isToday(matchDate)) {
      return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{`Hoje às ${format(matchDate, "HH:mm", { locale: ptBR })}`}</div>;
    }

    return <div className="text-xs text-muted-foreground flex items-center justify-center gap-2"><Calendar className="w-3 h-3"/>{format(matchDate, "eeee, dd/MM 'às' HH:mm", { locale: ptBR })}</div>;
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bem-vindo, {apelido}!</h1>
          <p className="text-muted-foreground">Boa sorte nos seus próximos palpites.</p>
        </div>

        <section>
             <Card className="bg-gradient-to-tr from-yellow-400/20 via-background to-background relative overflow-hidden border-yellow-500/50">
                 <CardHeader className="flex flex-row items-center gap-4 p-4">
                     <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-yellow-400 to-amber-600 animate-leader-pulse">
                        <Avatar className="w-full h-full border-4 border-background">
                            <AvatarImage src={`https://placehold.co/100x100.png?text=${leader.apelido.charAt(0)}`} alt={leader.apelido} />
                            <AvatarFallback>{leader.apelido.substring(0,2)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1">
                        <CardDescription className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500"/>Líder do Ranking</CardDescription>
                        <CardTitle className="text-2xl font-headline text-primary">{leader.apelido}</CardTitle>
                        <p className="font-bold text-lg">{leader.pontos} pts</p>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/dashboard/leaderboard">
                            Ver Ranking
                        </Link>
                    </Button>
                 </CardHeader>
                 <div className="absolute -bottom-4 -right-4">
                    <Medal className="w-24 h-24 text-yellow-500/20" strokeWidth={1} />
                 </div>
            </Card>
        </section>

        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <Zap className="w-6 h-6 text-accent animate-pulse" />
                    Acontecendo Agora
                </h2>
            </div>
            <div className="w-full space-y-4">
              {liveMatches.map((match) => {
                const prediction = mockPredictions.find(p => p.matchId === match.id && p.userId === mockUser.id);
                if (!prediction) return null;

                return (
                  <Accordion type="single" collapsible className="w-full" key={match.id}>
                    <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                      <Card className='border-accent/50'>
                        <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction.pontos))}>
                          <div className="flex flex-col items-center justify-center w-full">
                             <div className="flex items-center justify-center w-full">
                                 <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                    {match.timeA}
                                </div>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                    <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                    <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                </div>
                                <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                   {match.timeB}
                                </div>
                             </div>
                             <Badge variant={getStatusVariant(match.status)} className={cn('mt-2', match.status === 'Ao Vivo' && 'animate-pulse')}>
                                {match.status}
                              </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos))}>
                             <div className="flex justify-between items-center w-full">
                                 <span className="font-bold w-1/3 text-left">Seu Palpite:</span>
                                 <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                 <div className="w-1/3 text-right">
                                     <Badge variant={getPointsBadgeVariant(prediction.pontos)} className={cn('whitespace-nowrap', prediction.pontos === 10 && 'bg-green-600 text-white', prediction.pontos > 0 && 'bg-blue-600 text-white' )}>
                                         {prediction.pontos} pts
                                     </Badge>
                                 </div>
                             </div>
                          </div>
                          <div className="bg-background/80 border-t">
                            <div className="text-center py-2">
                                <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Outros Palpites</h4>
                            </div>
                            <ul className="text-sm">
                                {prediction.outrosPalpites.map((p, i) => (
                                    <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.pontos))}>
                                        <span className="font-bold w-1/3 text-left">{p.apelido}:</span>
                                        <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpite.replace(/\s/g, '')}</span>
                                        <div className="w-1/3 text-right">
                                             <Badge variant={getPointsBadgeVariant(p.pontos)} className={cn('whitespace-nowrap', p.pontos === 10 && 'bg-green-600 text-white', p.pontos > 0 && 'bg-blue-600 text-white')}>
                                                 {p.pontos} pts
                                             </Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-primary" />
                  Próximas Partidas
              </h2>
              <Button asChild variant="link">
                  <Link href="/dashboard/predictions">Ver todos &rarr;</Link>
              </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => {
              const userHasPredicted = mockPredictions.some(p => p.matchId === match.id && p.userId === mockUser.id);
              const needsAttention = isClient && differenceInHours(parseISO(match.data), new Date()) < 2 && !userHasPredicted;
              
              return (
                <Link href="/dashboard/predictions" key={match.id} className="block hover:scale-[1.02] transition-transform duration-200">
                  <Card className={cn(
                      "flex flex-col h-full overflow-hidden",
                      needsAttention && "border-accent animate-pulse"
                  )}>
                    <CardHeader className='pb-2'>
                        <div className="flex justify-between items-start">
                          <CardDescription className="text-xs">{match.campeonato}</CardDescription>
                           <Badge variant={getStatusVariant(match.status)}>
                              {match.status}
                           </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center p-4">
                      <div className="flex items-center justify-around w-full text-center">
                          <div className='flex flex-col items-center gap-2'>
                             <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                             <p className="font-semibold text-sm">{match.timeA}</p>
                          </div>
                          <span className="text-2xl font-bold text-muted-foreground">vs</span>
                           <div className='flex flex-col items-center gap-2'>
                             <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                             <p className="font-semibold text-sm">{match.timeB}</p>
                          </div>
                      </div>
                    </CardContent>
                    <CardContent className="text-center bg-muted/50 py-2">
                       <UpcomingMatchDate matchDateString={match.data} />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                  <History className="w-6 h-6 text-primary" />
                  Resultados Recentes
              </h2>
              <Button asChild variant="link">
                  <Link href="/dashboard/history">Ver histórico completo &rarr;</Link>
              </Button>
          </div>
          <div className="w-full space-y-4">
              {mockMatches.recent.slice(0, 3).map((match) => {
                  const prediction = mockPredictions.find(p => p.matchId === match.id && p.userId === mockUser.id);
                  if (!prediction) return null;

                  return (
                    <Accordion type="single" collapsible className="w-full" key={match.id}>
                      <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                        <Card>
                         <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction.pontos))}>
                          <div className="flex flex-col items-center justify-center w-full">
                             <div className="flex items-center justify-center w-full">
                                 <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                    {match.timeA}
                                </div>
                                <div className="flex items-center justify-center gap-3 md:gap-4">
                                    <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                    <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                    <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={56} height={56} className="rounded-full border" data-ai-hint="team logo" />
                                </div>
                                <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                   {match.timeB}
                                </div>
                             </div>
                             <span className="text-xs text-muted-foreground mt-2">
                                {format(parseISO(match.data), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos))}>
                             <div className="flex justify-between items-center w-full">
                                 <span className="font-bold w-1/3 text-left">Seu Palpite:</span>
                                 <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                                 <div className="w-1/3 text-right">
                                     <Badge variant={getPointsBadgeVariant(prediction.pontos)} className={cn('whitespace-nowrap', prediction.pontos === 10 && 'bg-green-600 text-white', prediction.pontos > 0 && 'bg-blue-600 text-white' )}>
                                         {prediction.pontos} pts
                                     </Badge>
                                 </div>
                             </div>
                          </div>
                          <div className="bg-background/80 border-t">
                            <div className="text-center py-2">
                                <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Outros Palpites</h4>
                            </div>
                            <ul className="text-sm">
                                {prediction.outrosPalpites.map((p, i) => (
                                    <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.pontos))}>
                                        <span className="font-bold w-1/3 text-left">{p.apelido}:</span>
                                        <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpite.replace(/\s/g, '')}</span>
                                        <div className="w-1/3 text-right">
                                            <Badge variant={getPointsBadgeVariant(p.pontos)} className={cn('whitespace-nowrap', p.pontos === 10 && 'bg-green-600 text-white', p.pontos > 0 && 'bg-blue-600 text-white')}>
                                                {p.pontos} pts
                                            </Badge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                          </div>
                        </AccordionContent>
                        </Card>
                      </AccordionItem>
                    </Accordion>
                  );
              })}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}

    