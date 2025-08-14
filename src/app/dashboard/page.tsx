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
import { mockUser, mockMatches, mockPredictions } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Calendar, Radio, History } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { apelido } = mockUser;
  
  const liveAndUpcomingMatches = mockMatches.upcoming.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    if (status === 'Ao Vivo') return 'destructive';
    if (status === 'Agendado') return 'secondary';
    return 'default';
  };

  const getPredictionStatusClass = (pontos: number) => {
    if (pontos === 10) return 'bg-green-100/80 dark:bg-green-900/40'; // Acerto exato
    if (pontos === 5) return 'bg-blue-100/80 dark:bg-blue-900/40';   // Acerto de situação
    return 'bg-red-100/80 dark:bg-red-900/40';       // Erro
  }
  
  const getPointsBadgeVariant = (pontos: number): "default" | "secondary" | "destructive" => {
    if (pontos === 10) return 'default';
    if (pontos === 5) return 'secondary';
    return 'destructive';
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bem-vindo, {apelido}!</h1>
          <p className="text-muted-foreground">Boa sorte nos seus próximos palpites.</p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-2">
                  <Radio className="w-6 h-6 text-primary animate-pulse" />
                  Ao Vivo / Próximas Partidas
              </h2>
              <Button asChild variant="link">
                  <Link href="/dashboard/predictions">Ver todos &rarr;</Link>
              </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveAndUpcomingMatches.slice(0, 3).map((match) => (
              <Link href="/dashboard/predictions" key={match.id} className="block hover:scale-[1.02] transition-transform duration-200">
                <Card className="flex flex-col h-full overflow-hidden">
                  <CardHeader className='pb-2'>
                      <div className="flex justify-between items-start">
                        <CardDescription className="text-xs">{match.campeonato}</CardDescription>
                         <Badge variant={getStatusVariant(match.status)} className={cn(match.status === 'Ao Vivo' && 'animate-pulse')}>
                            {match.status}
                         </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-center p-4">
                    <div className="flex items-center justify-around w-full text-center">
                        <div className='flex flex-col items-center gap-2'>
                           <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeA}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                           <p className="font-semibold text-sm">{match.timeA}</p>
                        </div>
                        <span className="text-2xl font-bold text-muted-foreground">vs</span>
                         <div className='flex flex-col items-center gap-2'>
                           <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeB}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                           <p className="font-semibold text-sm">{match.timeB}</p>
                        </div>
                    </div>
                  </CardContent>
                  <CardContent className="text-center bg-muted/50 py-2">
                     <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                        <Calendar className="w-3 h-3"/>
                        {format(parseISO(match.data), "eeee, dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
          <Card>
              <CardContent className="p-4 md:p-6">
                  <Accordion type="single" collapsible className="w-full">
                      {mockMatches.recent.slice(0, 3).map((match) => {
                          const prediction = mockPredictions.find(p => p.matchId === match.id && p.userId === mockUser.id);
                          if (!prediction) return null;

                          return (
                            <AccordionItem value={match.id} key={match.id} className='border rounded-lg mb-2 overflow-hidden'>
                              <AccordionTrigger className={cn("p-4 hover:no-underline rounded-t-lg", getPredictionStatusClass(prediction.pontos))}>
                                <div className="flex justify-between items-center w-full">
                                  <div className='flex-1 text-right font-semibold text-sm md:text-base'>
                                      {match.timeA}
                                  </div>
                                  <div className="flex items-center justify-center gap-3 md:gap-4 mx-4">
                                      <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeA}`} width={24} height={24} className="rounded-full border" data-ai-hint="team logo" />
                                      <div className="flex flex-col items-center text-center">
                                          <span className="text-lg md:text-xl font-bold">{`${match.placarA} - ${match.placarB}`}</span>
                                          <span className="text-xs text-muted-foreground">
                                              {format(parseISO(match.data), "dd/MM/yy", { locale: ptBR })}
                                          </span>
                                      </div>
                                      <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeB}`} width={24} height={24} className="rounded-full border" data-ai-hint="team logo" />
                                  </div>
                                  <div className='flex-1 text-left font-semibold text-sm md:text-base'>
                                      {match.timeB}
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className='p-0'>
                                <div className={cn("p-4 space-y-4", getPredictionStatusClass(prediction.pontos))}>
                                    <div className="bg-background/30 rounded-md p-4 text-center">
                                        <h4 className="font-semibold mb-2">Seu Palpite</h4>
                                        <div className="flex items-center justify-center gap-4">
                                            <span className="text-2xl font-bold">{prediction.palpiteUsuario.placarA} - {prediction.palpiteUsuario.placarB}</span>
                                            <Badge variant={getPointsBadgeVariant(prediction.pontos)} className={cn('whitespace-nowrap', prediction.pontos === 10 && 'bg-green-600 text-white', prediction.pontos === 5 && 'bg-blue-600 text-white' )}>
                                                {prediction.pontos} pts
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                 <div className="bg-background/5 border-t">
                                     <div className="text-center py-2">
                                         <h4 className="font-semibold flex items-center justify-center gap-2"><Users className="w-4 h-4" /> Outros Palpites</h4>
                                     </div>
                                     <ul className="space-y-2 text-sm px-4 pb-4">
                                         {prediction.outrosPalpites.map((p, i) => (
                                             <li key={i} className={cn("flex justify-between items-center p-2 rounded-md", getPredictionStatusClass(p.pontos))}>
                                                 <span className="font-bold w-1/3 text-left">{p.apelido}:</span>
                                                 <span className="flex-1 text-center font-mono text-base">{p.palpite}</span>
                                                  <div className="w-1/3 text-right">
                                                      <Badge variant={getPointsBadgeVariant(p.pontos)} className={cn('whitespace-nowrap', p.pontos === 10 && 'bg-green-600 text-white', p.pontos === 5 && 'bg-blue-600 text-white')}>
                                                          {p.pontos} pts
                                                      </Badge>
                                                  </div>
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                      })}
                  </Accordion>
              </CardContent>
          </Card>
        </section>

      </div>
    </TooltipProvider>
  );
}
