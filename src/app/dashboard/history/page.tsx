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
import { mockMatches, mockPredictions } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users } from 'lucide-react';

export default function HistoryPage() {
  const finishedMatches = [...mockMatches.recent].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

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
              const prediction = mockPredictions.find(p => p.matchId === match.id);
              // Se não houver palpite para uma partida finalizada, não a exibimos no histórico do usuário
              if (!prediction) return null;

              return (
                <AccordionItem value={match.id} key={match.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{`${match.timeA} vs ${match.timeB}`}</span>
                        <span className="text-sm text-muted-foreground">
                           {format(new Date(match.data), "dd/MM/yyyy", { locale: ptBR })}
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
    </div>
  );
}
