
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockChampionships, mockAllMatches, Match } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, MoreHorizontal, Pencil, Trash2, Eye, ShieldAlert, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MatchForm } from '@/components/admin/match-form';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        try {
            const date = parseISO(dateString);
            setFormattedDate(format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
        } catch (error) {
            setFormattedDate("Data inválida");
        }
    }, [dateString]);
  
    if (!formattedDate) {
        return null; 
    }
  
    return <>{formattedDate}</>;
};

export default function AdminMatchesPage() {
    const [matches, setMatches] = useState<Match[]>(mockAllMatches);
    const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>('');
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    
    const filteredMatches = useMemo(() => {
        if (!selectedChampionshipId) return [];
        return matches
            .filter(match => match.campeonatoId === selectedChampionshipId)
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    }, [selectedChampionshipId, matches]);

    const handleCreate = () => {
        setEditingMatch(null);
        setIsFormOpen(true);
    };

    const handleEdit = (match: Match) => {
        setEditingMatch(match);
        setIsFormOpen(true);
    };

    const handleDelete = (matchId: string) => {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        toast({
            title: "Partida Excluída",
            description: "A partida foi removida com sucesso.",
        });
    };

    const handleFormSubmit = (data: Match) => {
        if (editingMatch) {
            setMatches(prev => prev.map(m => m.id === data.id ? data : m));
            toast({
                title: "Partida Atualizada",
                description: `A partida ${data.timeA} vs ${data.timeB} foi atualizada.`,
            });
        } else {
            setMatches(prev => [...prev, data]);
            toast({
                title: "Partida Criada!",
                description: `A partida ${data.timeA} vs ${data.timeB} foi adicionada.`,
            });
        }
    };


    const getStatusVariant = (status: Match['status']): "default" | "destructive" | "secondary" | "outline" => {
        switch(status) {
            case 'Ao Vivo': return 'destructive';
            case 'Agendado': return 'secondary';
            case 'Finalizado': return 'default';
            case 'Cancelado': return 'outline';
            default: return 'secondary';
        }
    }

    return (
        <TooltipProvider>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <CalendarCheck className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Partidas</h1>
                        <p className="text-muted-foreground">Adicione, edite e atualize os resultados das partidas.</p>
                    </div>
                </div>

                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="championship-select" className="text-sm font-medium text-muted-foreground">
                            Selecione um campeonato para ver as partidas
                        </label>
                        <Select value={selectedChampionshipId} onValueChange={setSelectedChampionshipId}>
                            <SelectTrigger id="championship-select" className="w-full md:w-[320px] mt-1">
                                <SelectValue placeholder="Escolha um campeonato..." />
                            </SelectTrigger>
                            <SelectContent>
                                {mockChampionships.map(champ => (
                                    <SelectItem key={champ.id} value={champ.id}>{champ.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedChampionshipId && (
                        <div className="self-end">
                            <MatchForm
                                isOpen={isFormOpen}
                                setIsOpen={setIsFormOpen}
                                onSubmit={handleFormSubmit}
                                match={editingMatch}
                                championshipId={selectedChampionshipId}
                            >
                                <Button onClick={handleCreate}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Partida
                                </Button>
                            </MatchForm>
                        </div>
                    )}
                </div>

                {selectedChampionshipId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Partidas de {mockChampionships.find(c => c.id === selectedChampionshipId)?.nome}
                            </CardTitle>
                            <CardDescription>
                                Total de {filteredMatches.length} partidas encontradas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Confronto</TableHead>
                                        <TableHead className="hidden sm:table-cell">Data</TableHead>
                                        <TableHead className="hidden md:table-cell">Fase</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMatches.length > 0 ? (
                                        filteredMatches.map(match => (
                                            <TableRow key={match.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Image src="https://placehold.co/40x40.png" alt={match.timeA} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{match.timeA}</p></TooltipContent>
                                                        </Tooltip>
                                                        <span className="hidden sm:inline truncate">{match.timeA}</span>
                                                        <span className="text-muted-foreground text-xs">vs</span>
                                                        <span className="hidden sm:inline truncate">{match.timeB}</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Image src="https://placehold.co/40x40.png" alt={match.timeB} width={24} height={24} className="rounded-full" data-ai-hint="team logo" />
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>{match.timeB}</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <div className="text-muted-foreground text-xs md:hidden mt-1">{match.fase}</div>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    <FormattedDate dateString={match.data} />
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">{match.fase}</TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getStatusVariant(match.status)} className={cn(match.status === 'Ao Vivo' && 'animate-pulse')}>
                                                        {match.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <AlertDialog>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Abrir menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Atualizar Placar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEdit(match)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Editar Partida
                                                                </DropdownMenuItem>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Excluir
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                A partida <strong>{match.timeA} vs {match.timeB}</strong> será removida permanentemente. Esta ação não pode ser desfeita.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(match.id)}>Sim, excluir</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                Nenhuma partida encontrada para este campeonato.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-10 border-dashed">
                        <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-center text-muted-foreground">
                            Por favor, selecione um campeonato acima para começar.
                        </p>
                    </Card>
                )}
            </div>
        </TooltipProvider>
    );
}
