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
    if (pontos === 10) return 'bg-green-100/80 dark:bg-green-900/40 border-green-500/50'; // Acerto exato
    if (pontos === 5) return 'bg-blue-100/80 dark:bg-blue-900/40 border-blue-500/50';   // Acerto de situação
    return 'bg-red-100/80 dark:bg-red-900/40 border-red-500/50';       // Erro
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
                <AccordionItem value={match.id} key={match.id} className={cn('border-b-0 rounded-lg mb-2 border', getPredictionStatusClass(prediction.pontos))}>
                  <AccordionTrigger className="p-4 hover:no-underline rounded-lg">
                    <div className="flex justify-between items-center w-full">
                      <div className='flex items-center gap-3 md:gap-4'>
                          <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeA}`} width={24} height={24} className="rounded-full border" data-ai-hint="team logo" />
                          <span className="font-semibold text-sm md:text-base">{match.timeA}</span>
                      </div>
                      <div className="flex flex-col items-center text-center">
                          <span className="text-lg md:text-xl font-bold">{`${match.placarA} - ${match.placarB}`}</span>
                           <span className="text-xs text-muted-foreground">
                              {format(parseISO(match.data), "dd/MM/yy", { locale: ptBR })}
                          </span>
                      </div>
                      <div className='flex items-center gap-3 md:gap-4'>
                          <span className="font-semibold text-sm md:text-base">{match.timeB}</span>
                          <Image src="https://placehold.co/64x64.png" alt={`Bandeira ${match.timeB}`} width={24} height={24} className="rounded-full border" data-ai-hint="team logo" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-b-md mx-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                            <div className="md:col-span-1">
                                <h4 className="font-semibold mb-2 text-center">Resultado Final</h4>
                                <div className="flex items-center justify-center p-2 rounded-md bg-background/50">
                                    <span className="text-2xl font-bold">{match.placarA} - {match.placarB}</span>
                                </div>
                            </div>
                            <div className="md:col-span-1">
                                <h4 className="font-semibold mb-2 text-center">Seu Palpite</h4>
                                <div className="flex items-center justify-center p-2 rounded-md bg-background">
                                    <span className="text-2xl font-bold">{prediction.palpiteUsuario.placarA} - {prediction.palpiteUsuario.placarB}</span>
                                     <Badge variant={prediction.pontos > 0 ? (prediction.pontos >= 10 ? 'default' : 'secondary') : 'destructive'} className={cn('ml-4', prediction.pontos >= 10 ? 'bg-green-600 text-white' : '')}>
                                        {prediction.pontos} pts
                                    </Badge>
                                </div>
                            </div>
                             <div className="md:col-span-1">
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
    </div>
  );
}