import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockMatches, mockPredictions, mockUser } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const finishedMatches = [...mockMatches.recent].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

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
    <div className="container mx-auto space-y-8">
       <div>
            <h1 className="text-3xl font-bold font-headline">Histórico de Palpites</h1>
            <p className="text-muted-foreground">
                Reveja seus palpites passados e suas pontuações.
            </p>
        </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {finishedMatches.map((match) => {
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
                    <div className={cn("p-2", getPredictionStatusClass(prediction.pontos))}>
                        <div className="bg-background/30 rounded-md p-2 flex items-center">
                            <h4 className="font-semibold w-1/3 text-left">Seu Palpite</h4>
                            <div className="flex-1 text-center font-mono text-base">{prediction.palpiteUsuario.placarA} - {prediction.palpiteUsuario.placarB}</div>
                             <div className="w-1/3 text-right">
                                <Badge variant={getPointsBadgeVariant(prediction.pontos)} className={cn('whitespace-nowrap', prediction.pontos === 10 && 'bg-green-600 text-white', prediction.pontos === 5 && 'bg-blue-600 text-white' )}>
                                    {prediction.pontos} pts
                                </Badge>
                            </div>
                        </div>
                    </div>
                     <div className="bg-background/5 border-t">
                         <div className="text-center py-1">
                             <h4 className="font-semibold flex items-center justify-center gap-2"><Users className="w-4 h-4" /> Outros Palpites</h4>
                         </div>
                         <ul className="space-y-1 text-sm px-1 pb-1">
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
    </div>
  );
}
