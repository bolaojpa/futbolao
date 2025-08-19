
'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockMatches, mockPredictions, mockUser, mockChampionships } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, History } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type FilterType = 'all' | 'exact' | 'situation' | 'miss';

export default function HistoryPage() {
  const searchParams = useSearchParams();
  const championshipIdFromQuery = searchParams.get('championshipId');
  const filterTypeFromQuery = searchParams.get('filterType') as FilterType | null;

  const [selectedChampionship, setSelectedChampionship] = useState<string>(championshipIdFromQuery || mockChampionships[0].id);
  const [filterType, setFilterType] = useState<FilterType>(filterTypeFromQuery || 'all');
  
  // Sincroniza o estado com os parâmetros da URL, caso eles mudem.
  useEffect(() => {
    if (championshipIdFromQuery) {
      setSelectedChampionship(championshipIdFromQuery);
    }
    if (filterTypeFromQuery) {
      setFilterType(filterTypeFromQuery);
    }
  }, [championshipIdFromQuery, filterTypeFromQuery]);

  const filteredMatches = [...mockMatches.recent]
    .filter(match => {
        const prediction = mockPredictions.find(p => p.matchId === match.id && p.userId === mockUser.id);
        if (!prediction || !match.maxPontos) return false;
        
        // Primeiro, filtra pelo campeonato
        const championshipMatch = match.campeonato === mockChampionships.find(c => c.id === selectedChampionship)?.nome;
        if (!championshipMatch) return false;

        // Depois, pelo tipo de acerto
        switch (filterType) {
            case 'exact':
                return prediction.pontos === match.maxPontos && match.maxPontos > 0;
            case 'situation':
                return prediction.pontos > 0 && prediction.pontos < match.maxPontos;
            case 'miss':
                return prediction.pontos === 0;
            case 'all':
            default:
                return true;
        }
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());


  const getPredictionStatusClass = (pontos: number, maxPontos: number) => {
    if (pontos === maxPontos && maxPontos > 0) return 'bg-green-100/80 dark:bg-green-900/40';
    if (pontos > 0) return 'bg-blue-100/80 dark:bg-blue-900/40';
    return 'bg-red-100/80 dark:bg-red-900/40';
  };

  const getPointsBadgeVariant = (pontos: number, maxPontos: number): "success" | "default" | "destructive" => {
    if (pontos === maxPontos && maxPontos > 0) return 'success';
    if (pontos > 0) return 'default';
    return 'destructive';
  };

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Histórico de Palpites</h1>
          <p className="text-muted-foreground">
            Reveja seus palpites passados e suas pontuações.
          </p>
        </div>
      </div>
      
       <div className="flex flex-col md:flex-row gap-2">
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
           <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder="Filtrar por resultado" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Mostrar Todos</SelectItem>
                  <SelectItem value="exact">Acertos de Placar Exato</SelectItem>
                  <SelectItem value="situation">Acertos de Situação</SelectItem>
                  <SelectItem value="miss">Errados</SelectItem>
              </SelectContent>
          </Select>
      </div>

      <div className="w-full space-y-4">
        {filteredMatches.length > 0 ? filteredMatches.map((match) => {
          const prediction = mockPredictions.find(p => p.matchId === match.id && p.userId === mockUser.id);
          if (!prediction || !match.maxPontos) return null;

          const maxPointsForMatch = match.maxPontos;

          return (
            <Accordion type="single" collapsible className="w-full" key={match.id}>
              <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                <Card>
                  <AccordionTrigger className={cn("p-4 hover:no-underline", getPredictionStatusClass(prediction.pontos, maxPointsForMatch))}>
                    <div className="flex flex-col items-center justify-center w-full">
                      <div className="flex items-center justify-center w-full">
                        <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                          {match.timeA}
                        </div>
                        <div className="flex items-center justify-center gap-3 md:gap-4">
                          <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeA}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                          <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                          <Image src="https://placehold.co/128x128.png" alt={`Bandeira ${match.timeB}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
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
                    <div className={cn("p-4 border-t", getPredictionStatusClass(prediction.pontos, maxPointsForMatch))}>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold w-1/3 text-left">Seu Palpite:</span>
                        <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{prediction.palpiteUsuario.placarA}-{prediction.palpiteUsuario.placarB}</span>
                        <div className="w-1/3 text-right">
                          <Badge variant={getPointsBadgeVariant(prediction.pontos, maxPointsForMatch)} className='whitespace-nowrap'>
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
                          <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.pontos, maxPointsForMatch))}>
                            <div className="font-bold w-1/3 text-left">
                               <Link href={`/dashboard/profile?userId=${p.userId}`} className="hover:underline">
                                {p.apelido}:
                              </Link>
                            </div>
                            <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpite.replace(/\s/g, '')}</span>
                            <div className="w-1/3 text-right">
                              <Badge variant={getPointsBadgeVariant(p.pontos, maxPointsForMatch)} className='whitespace-nowrap'>
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
        }) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Nenhum resultado encontrado para os filtros selecionados.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
