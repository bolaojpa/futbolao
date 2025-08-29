'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAllMatches, mockPredictions, mockChampionships, mockUsers } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, History, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | 'exact' | 'situation' | 'miss';
const ITEMS_PER_PAGE = 10;
type Match = typeof mockAllMatches[0];

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(parseISO(dateString), "dd/MM/yy 'às' HH:mm", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <span className="text-xs text-muted-foreground">{formattedDate}</span>;
};

export default function AdminHistoryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const championshipIdFromQuery = searchParams.get('championshipId');
  const [selectedChampionship, setSelectedChampionship] = useState<string>(championshipIdFromQuery || mockChampionships[0].id);
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredMatches = useMemo(() => [...mockAllMatches]
    .filter(match => match.status === 'Finalizado' && match.campeonatoId === selectedChampionship)
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()), [selectedChampionship]);


  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('championshipId', value);
    router.push(`${pathname}?${params.toString()}`);
    setSelectedChampionship(value);
    setCurrentPage(1); 
  };


  // Lógica de Paginação e Agrupamento
  const groupedAndPaginatedMatches = useMemo(() => {
    const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE); 
    
    const paginatedItems = filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
     const paginatedGrouped = paginatedItems.reduce((acc, match) => {
        const phase = match.fase || 'Resultados Gerais';
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push(match);
        return acc;
    }, {} as Record<string, Match[]>);

    return { paginatedItems: paginatedGrouped, totalPages };
  }, [filteredMatches, currentPage]);


  const { paginatedItems, totalPages } = groupedAndPaginatedMatches;

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
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Histórico de Partidas</h1>
          <p className="text-muted-foreground">
            Consulte os resultados e os palpites de todas as partidas finalizadas.
          </p>
        </div>
      </div>
      
       <div className="flex flex-col md:flex-row gap-2 mb-8">
          <Select value={selectedChampionship} onValueChange={handleFilterChange}>
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

      <div className="w-full space-y-4">
        {Object.keys(paginatedItems).length > 0 ? (
          Object.entries(paginatedItems).map(([phase, matches]) => (
            <div key={phase} className="space-y-4">
              <h3 className="text-xl font-bold font-headline ml-1">{phase}</h3>
              {matches.map((match) => {
                // Pegar todos os palpites para esta partida
                const allPredictionsForMatch = mockPredictions.filter(p => p.matchId === match.id);
                if (!match.maxPontos) return null;

                const maxPointsForMatch = match.maxPontos;

                return (
                  <Accordion type="single" collapsible className="w-full" key={match.id}>
                    <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                      <Card>
                        <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50">
                          <div className="flex flex-col items-center justify-center w-full">
                            <div className="flex items-center justify-center w-full">
                              <div className='hidden md:block flex-shrink-0 w-1/3 text-right font-semibold text-sm md:text-base pr-2'>
                                {match.timeA}
                              </div>
                              <div className="flex items-center justify-center gap-3 md:gap-4">
                                <Image src="https://picsum.photos/128/128" alt={`Bandeira ${match.timeA}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                                <span className="text-lg md:text-xl font-bold whitespace-nowrap">{`${match.placarA}-${match.placarB}`}</span>
                                <Image src="https://picsum.photos/128/128" alt={`Bandeira ${match.timeB}`} width={48} height={48} className="rounded-full border" data-ai-hint="team logo" />
                              </div>
                              <div className='hidden md:block flex-shrink-0 w-1/3 text-left font-semibold text-sm md:text-base pl-2'>
                                {match.timeB}
                              </div>
                            </div>
                            <div className='flex flex-col items-center justify-center mt-2 gap-2'>
                              <Badge variant="secondary">{match.status}</Badge>
                              <FormattedDate dateString={match.data} />
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="bg-background/80 border-t">
                            <div className="text-center py-2">
                              <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários</h4>
                            </div>
                            {allPredictionsForMatch.length > 0 ? (
                                <ul className="text-sm">
                                  {allPredictionsForMatch.map((p, i) => {
                                    const user = mockUsers.find(u => u.id === p.userId);
                                    if (!user) return null;
                                    return (
                                    <li key={i} className={cn("flex justify-between items-center p-4 border-t", getPredictionStatusClass(p.pontos, maxPointsForMatch))}>
                                      <div className="w-1/3 text-left flex items-center gap-2 group">
                                        <div className="relative">
                                            <Avatar className="w-8 h-8">
                                            <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                            <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                                            </Avatar>
                                            <StatusIndicator status={user.presenceStatus} className="w-3 h-3 top-0 right-0" />
                                        </div>
                                        <span className="font-bold">{user.apelido}:</span>
                                      </div>
                                      <span className="w-1/3 text-center font-mono font-semibold text-base whitespace-nowrap">{p.palpiteUsuario.placarA}-{p.palpiteUsuario.placarB}</span>
                                      <div className="w-1/3 text-right">
                                        <Badge variant={getPointsBadgeVariant(p.pontos, maxPointsForMatch)} className='whitespace-nowrap'>
                                          {p.pontos} pts
                                        </Badge>
                                      </div>
                                    </li>
                                  )})}
                                </ul>
                            ) : (
                                <div className="text-center p-4 text-muted-foreground">Nenhum palpite foi registrado para esta partida.</div>
                            )}
                          </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  </Accordion>
                );
              })}
            </div>
          ))
        ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Nenhum resultado encontrado para o campeonato selecionado.</p>
                </CardContent>
            </Card>
        )}
      </div>

       {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button 
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
      )}
    </div>
  );
}
