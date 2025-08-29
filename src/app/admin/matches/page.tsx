
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockAllMatches, mockPredictions, mockChampionships, mockUsers, mockUser } from '@/lib/data';
import { format, parseISO, differenceInHours, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, CalendarCheck, ChevronLeft, ChevronRight, AlarmClock, Calendar, Swords, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/shared/status-indicator';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/shared/countdown';
import { MatchForm } from '@/components/admin/match-form';
import type { Match } from '@/lib/data';

const ITEMS_PER_PAGE = 10;

const UpcomingMatchDate = ({ matchDateString }: { matchDateString: string }) => {
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

export default function AdminMatchesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const championshipIdFromQuery = searchParams.get('championshipId');
  const [selectedChampionship, setSelectedChampionship] = useState<string>(championshipIdFromQuery || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [matches, setMatches] = useState<Match[]>(mockAllMatches);

  useEffect(() => {
      setIsClient(true);
  }, [])
  
  const filteredMatches = useMemo(() => matches
    .filter(match => {
        const isScheduled = match.status === 'Agendado';
        const isChampionshipMatch = selectedChampionship === 'all' || match.campeonatoId === selectedChampionship;
        return isScheduled && isChampionshipMatch;
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()), [selectedChampionship, matches]);


  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('championshipId', value);
    router.push(`${pathname}?${params.toString()}`);
    setSelectedChampionship(value);
    setCurrentPage(1); 
  };

  const handleFormSubmit = (data: Match) => {
    // Para edição (não implementado neste fluxo, mas a estrutura está aqui)
    // if (editingMatch) {
    //     setMatches(prev => prev.map(m => m.id === data.id ? data : m));
    // } else {
    // Lógica de Criação
    setMatches(prev => [...prev, data]);
    // }
  };


  const paginatedMatches = useMemo(() => {
     return filteredMatches.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
  }, [filteredMatches, currentPage]);

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <CalendarCheck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Visualizar Palpites</h1>
          <p className="text-muted-foreground">
            Consulte os palpites enviados para as partidas agendadas.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-2 mb-8 items-center">
          <Select value={selectedChampionship} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[280px] sm:max-w-xs [&>span]:truncate">
                  <SelectValue placeholder="Filtrar por campeonato" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos os Campeonatos</SelectItem>
                  {mockChampionships.map(champ => (
                      <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <MatchForm 
            isOpen={isFormOpen} 
            setIsOpen={setIsFormOpen}
            onSubmit={handleFormSubmit}
            match={null}
            championshipId={selectedChampionship}
          >
             <Button disabled={selectedChampionship === 'all'} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Partida
            </Button>
          </MatchForm>
      </div>


      <div className="w-full space-y-4">
        {paginatedMatches.length > 0 ? (
          paginatedMatches.map((match) => {
            const allPredictionsForMatch = mockPredictions.filter(p => p.matchId === match.id);
            const hasPredictions = allPredictionsForMatch.length > 0;
            const championship = mockChampionships.find(c => c.id === match.campeonatoId);

            return (
              <Accordion type="single" collapsible className="w-full" key={match.id} disabled={!hasPredictions}>
                <AccordionItem value={match.id} className="border-0 rounded-lg overflow-hidden">
                  <Card>
                    <AccordionTrigger className="p-4 hover:no-underline hover:bg-muted/50 data-[state=closed]:cursor-default data-[disabled]:cursor-default" disabled={!hasPredictions}>
                      <div className="flex flex-col items-center justify-center w-full gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                            {championship?.iconUrl && <Image src={championship.iconUrl} alt="" width={16} height={16} />}
                            {match.campeonato} - {match.fase}
                        </div>
                        <div className="flex items-center justify-center w-full">
                            <div className='flex-1 flex flex-row items-center justify-end gap-3'>
                                <span className="font-bold text-lg hidden md:block text-right truncate">{match.timeA}</span>
                                <Image src="https://picsum.photos/128/128" alt={`Bandeira ${match.timeA}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                            </div>
                             <div className="flex items-center justify-center text-muted-foreground mx-4">
                                <Swords className="h-6 w-6" />
                            </div>
                            <div className='flex-1 flex flex-row items-center justify-start gap-3'>
                                <Image src="https://picsum.photos/128/128" alt={`Bandeira ${match.timeB}`} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                <span className="font-bold text-lg hidden md:block text-left truncate">{match.timeB}</span>
                            </div>
                        </div>
                        <div className='flex flex-col items-center justify-center mt-2 gap-2'>
                           {isClient ? <UpcomingMatchDate matchDateString={match.data} /> : <div className="h-4 w-24 bg-muted rounded-md animate-pulse"></div>}
                        </div>
                      </div>
                    </AccordionTrigger>
                    {hasPredictions && (
                        <AccordionContent>
                        <div className="bg-background/80 border-t">
                            <div className="text-center py-2">
                            <h4 className="font-semibold flex items-center justify-center gap-2 py-1"><Users className="w-4 h-4" /> Palpites dos Usuários ({allPredictionsForMatch.length})</h4>
                            </div>
                                <ul className="text-sm">
                                {allPredictionsForMatch.map((p, i) => {
                                    const user = mockUsers.find(u => u.id === p.userId);
                                    if (!user) return null;
                                    return (
                                    <li key={i} className={cn("flex justify-between items-center p-4 border-t")}>
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
                                    </div>
                                    </li>
                                )})}
                                </ul>
                        </div>
                        </AccordionContent>
                    )}
                  </Card>
                </AccordionItem>
              </Accordion>
            );
          })
        ) : (
            <Card>
                <CardContent className="p-6 text-center">
                    <p>Nenhuma partida agendada para o campeonato selecionado.</p>
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
