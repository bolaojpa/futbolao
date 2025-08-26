
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockChampionships, mockAllMatches, Match } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarCheck, MoreHorizontal, Pencil, Trash2, Eye, ShieldAlert, PlusCircle, Save } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString, formatString = "dd/MM/yyyy 'às' HH:mm" }: { dateString: string, formatString?: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
        try {
            const date = parseISO(dateString);
            setFormattedDate(format(date, formatString, { locale: ptBR }));
        } catch (error) {
            setFormattedDate("Data inválida");
        }
    }, [dateString, formatString]);
  
    if (!formattedDate) {
        return null; 
    }
  
    return <span className='text-sm text-muted-foreground'>{formattedDate}</span>;
};

export default function AdminMatchesPage() {
    const [matches, setMatches] = useState<Match[]>(mockAllMatches);
    const [selectedChampionshipId, setSelectedChampionshipId] = useState<string>('');
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Estado para o modal de atualização de placar
    const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
    const [matchToUpdate, setMatchToUpdate] = useState<Match | null>(null);
    const [scoreA, setScoreA] = useState<string>('');
    const [scoreB, setScoreB] = useState<string>('');
    const [matchStatus, setMatchStatus] = useState<Match['status']>('Agendado');


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
    
    const openScoreModal = (match: Match) => {
        setMatchToUpdate(match);
        setScoreA(match.placarA?.toString() ?? '');
        setScoreB(match.placarB?.toString() ?? '');
        setMatchStatus(match.status);
        setIsScoreModalOpen(true);
    };

    const handleScoreUpdate = () => {
        if (!matchToUpdate) return;
        
        const numScoreA = scoreA === '' ? null : Number(scoreA);
        const numScoreB = scoreB === '' ? null : Number(scoreB);

        setMatches(prev => prev.map(m => 
            m.id === matchToUpdate.id 
            ? { ...m, placarA: numScoreA, placarB: numScoreB, status: matchStatus } 
            : m
        ));

        toast({
            title: "Placar Atualizado!",
            description: `O placar de ${matchToUpdate.timeA} vs ${matchToUpdate.timeB} foi salvo.`,
        });

        setIsScoreModalOpen(false);
        setMatchToUpdate(null);
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
                    <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                            <h2 className="text-2xl font-bold font-headline">
                                Partidas de {mockChampionships.find(c => c.id === selectedChampionshipId)?.nome}
                            </h2>
                             <p className="text-sm text-muted-foreground">
                                {filteredMatches.length} partidas encontradas.
                            </p>
                        </div>
                        
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map(match => (
                                <Card key={match.id}>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex items-center justify-center gap-3 md:gap-4">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Image src="https://placehold.co/128x128.png" alt={match.timeA} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{match.timeA}</p></TooltipContent>
                                                </Tooltip>
                                                <div className="hidden sm:block text-center">
                                                    <p className="font-bold">{match.timeA}</p>
                                                    <p className="text-muted-foreground text-xs">vs</p>
                                                    <p className="font-bold">{match.timeB}</p>
                                                </div>
                                                 <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Image src="https://placehold.co/128x128.png" alt={match.timeB} width={40} height={40} className="rounded-full border" data-ai-hint="team logo" />
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{match.timeB}</p></TooltipContent>
                                                </Tooltip>
                                            </div>
                                            <div className="border-l pl-4 ml-4">
                                                <p className="font-semibold text-primary">{match.fase}</p>
                                                <FormattedDate dateString={match.data} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="font-bold text-2xl tracking-tighter">
                                                    {match.placarA ?? '-'} x {match.placarB ?? '-'}
                                                </p>
                                                <Badge variant={getStatusVariant(match.status)} className={cn('mt-1', match.status === 'Ao Vivo' && 'animate-pulse')}>
                                                    {match.status}
                                                </Badge>
                                            </div>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-5 w-5" />
                                                            <span className="sr-only">Abrir menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openScoreModal(match)}>
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
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <Card className="flex flex-col items-center justify-center p-10 border-dashed">
                                <p className="text-center text-muted-foreground">
                                    Nenhuma partida encontrada para este campeonato.
                                </p>
                            </Card>
                        )}
                    </div>
                ) : (
                    <Card className="flex flex-col items-center justify-center p-10 border-dashed">
                        <ShieldAlert className="h-16 w-16 text-muted-foreground/50" />
                        <p className="mt-4 text-center text-muted-foreground">
                            Por favor, selecione um campeonato acima para começar.
                        </p>
                    </Card>
                )}
            </div>

            <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Atualizar Placar e Status</DialogTitle>
                     {matchToUpdate && (
                        <DialogDescription>
                            Partida: {matchToUpdate.timeA} vs {matchToUpdate.timeB}
                        </DialogDescription>
                    )}
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="scoreA">Placar {matchToUpdate?.timeA}</Label>
                                <Input id="scoreA" type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="scoreB">Placar {matchToUpdate?.timeB}</Label>
                                <Input id="scoreB" type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="mt-1" />
                            </div>
                        </div>
                        <div>
                             <Label htmlFor="status">Status da Partida</Label>
                             <Select value={matchStatus} onValueChange={(v) => setMatchStatus(v as Match['status'])}>
                                <SelectTrigger id="status" className="w-full mt-1">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Agendado">Agendado</SelectItem>
                                    <SelectItem value="Ao Vivo">Ao Vivo</SelectItem>
                                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsScoreModalOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={handleScoreUpdate}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                    </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </TooltipProvider>
    );

    