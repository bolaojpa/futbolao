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
import { Users, Calendar, Radio, History, Flag } from 'lucide-react';
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
                          const prediction = mockPredictions.find(p => p.matchId === match.id);
                          if (!prediction) return null;

                          return (
                              <AccordionItem value={match.id} key={match.id}>
                              <AccordionTrigger className="hover:no-underline">
                                  <div className="flex justify-between items-center w-full pr-4">
                                  <div className="flex flex-col text-left">
                                      <span className="font-semibold">{`${match.timeA} vs ${match.timeB}`}</span>
                                      <span className="text-sm text-muted-foreground">
                                      {format(parseISO(match.data), "dd/MM/yyyy", { locale: ptBR })}
                                      </span>
                                  </div>
                                  <div className="text-right">
                                      <span className="text-lg font-bold">{`${match.placarA} - ${match.placarB}`}</span>
                                      <div className="flex justify-end">
                                      <Badge variant={prediction.pontos > 0 ? (prediction.pontos >= 10 ? 'default' : 'secondary') : 'destructive'} className={prediction.pontos >= 10 ? 'bg-green-600 text-white' : ''}>
                                          {prediction.pontos} pts
                                      </Badge>
                                      </div>
                                  </div>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <h4 className="font-semibold mb-2">Seu Palpite</h4>
                                              <div className="flex items-center justify-center p-2 rounded-md bg-background">
                                                  <span className="text-2xl font-bold">{prediction.palpiteUsuario.placarA} - {prediction.palpiteUsuario.placarB}</span>
                                              </div>
                                          </div>
                                          <div>
                                              <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Outros Palpites</h4>
                                              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                                                  {prediction.outrosPalpites.map((p, i) => (
                                                      <li key={i}><strong>{p.apelido}:</strong> {p.palpite}</li>
                                                  ))}
                                              </ul>
                                          </div>
                                      </div>
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
