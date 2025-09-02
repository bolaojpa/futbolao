
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockChampionships as initialChampionships, mockTeams, Team } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChampionshipForm } from '@/components/admin/championship-form';
import type { Championship } from '@/lib/data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';


const ITEMS_PER_PAGE = 10;

// Componente para evitar erro de hidratação
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      try {
        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        setFormattedDate(format(date, "dd/MM/yyyy", { locale: ptBR }));
      } catch (error) {
        setFormattedDate("Data inválida");
      }
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <>{formattedDate}</>;
};

const FinalizeChampionshipModal = ({ championship, children }: { championship: Championship, children: React.ReactNode }) => {
    const [ranking, setRanking] = useState<Record<string, string>>({
        pos1: '', pos2: '', pos3: '', pos4: '', pos5: ''
    });
    const { toast } = useToast();

    const teamOptions = useMemo(() => {
        const filteredTeams = mockTeams.filter(team => {
            if (championship.modoEquipes === 'mista') return true;
            return team.type === (championship.modoEquipes === 'times' ? 'club' : 'national');
        });
        return filteredTeams.map(team => ({ label: team.name, value: team.name }));
    }, [championship]);

    const handleRankingChange = (position: string, value: string) => {
        setRanking(prev => ({ ...prev, [position]: value }));
    };

    const handleSaveRanking = () => {
        // Lógica para salvar o ranking e premiar os vencedores
        console.log("Saving final ranking:", ranking);
        toast({
            title: "Campeonato Finalizado!",
            description: `O ranking final de "${championship.nome}" foi salvo e os vencedores premiados.`,
        });
        // Aqui você fecharia o modal, o DialogClose faz isso automaticamente
    };
    
    const positions = [
        { key: 'pos1', label: '1º Lugar (Campeão)' },
        { key: 'pos2', label: '2º Lugar (Vice-campeão)' },
        { key: 'pos3', label: '3º Lugar' },
        { key: 'pos4', label: '4º Lugar' },
        { key: 'pos5', label: '5º Lugar' },
    ];

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Finalizar e Premiar Campeonato</DialogTitle>
                    <DialogDescription>
                        Insira a classificação final para o campeonato "{championship.nome}". Esta ação é irreversível.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {positions.map(pos => (
                         <div key={pos.key} className="space-y-2">
                            <Label htmlFor={pos.key}>{pos.label}</Label>
                            <Combobox
                                options={teamOptions}
                                value={ranking[pos.key]}
                                onChange={(value) => handleRankingChange(pos.key, value)}
                                placeholder="Selecione a equipe..."
                                searchPlaceholder="Buscar equipe..."
                                notFoundMessage="Nenhuma equipe encontrada."
                            />
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                     <DialogClose asChild>
                        <Button onClick={handleSaveRanking}>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar e Finalizar
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function AdminChampionshipsPage() {
    const [championships, setChampionships] = useState<Championship[]>(initialChampionships);
    const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    const handleCreate = () => {
        setEditingChampionship(null);
        setIsFormOpen(true);
    };

    const handleEdit = (championship: Championship) => {
        setEditingChampionship(championship);
        setIsFormOpen(true);
    };

    const handleDelete = (championshipId: string) => {
        setChampionships(prev => prev.filter(c => c.id !== championshipId));
        toast({
            title: "Campeonato Excluído",
            description: "O campeonato foi removido com sucesso.",
        });
    };

    const handleFormSubmit = (data: Championship) => {
        if (editingChampionship) {
            // Lógica de Edição
            setChampionships(prev => prev.map(c => c.id === data.id ? data : c));
            toast({
                title: "Campeonato Atualizado",
                description: `O campeonato "${data.nome}" foi atualizado.`,
            });
        } else {
            // Lógica de Criação
            setChampionships(prev => [...prev, data]);
            toast({
                title: "Campeonato Criado!",
                description: `O campeonato "${data.nome}" foi adicionado.`,
            });
        }
    };

    const sortedChampionships = useMemo(() => 
        [...championships].sort((a, b) => new Date(b.dataInicio as string).getTime() - new Date(a.dataInicio as string).getTime())
    , [championships]);

    const totalPages = Math.ceil(sortedChampionships.length / ITEMS_PER_PAGE);
    const paginatedChampionships = sortedChampionships.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gerenciar Campeonatos</h1>
                    <p className="text-muted-foreground">Crie, edite e organize os campeonatos do seu bolão.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <CardTitle>Campeonatos Ativos</CardTitle>
                            <CardDescription>
                                Um total de {championships.length} campeonatos cadastrados.
                            </CardDescription>
                        </div>
                         <ChampionshipForm
                            isOpen={isFormOpen}
                            setIsOpen={setIsFormOpen}
                            onSubmit={handleFormSubmit}
                            championship={editingChampionship}
                         >
                            <Button onClick={handleCreate}>
                                Criar Novo Campeonato
                            </Button>
                         </ChampionshipForm>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome do Campeonato</TableHead>
                                <TableHead className="hidden sm:table-cell">Data de Início</TableHead>
                                <TableHead className="hidden sm:table-cell">Data de Fim</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedChampionships.length > 0 ? (
                                paginatedChampionships.map(champ => (
                                    <TableRow key={champ.id}>
                                        <TableCell className="font-medium">{champ.nome}</TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <FormattedDate dateString={champ.dataInicio as unknown as string} />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <FormattedDate dateString={champ.dataFim as unknown as string} />
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
                                                        <DropdownMenuItem onClick={() => handleEdit(champ)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <FinalizeChampionshipModal championship={champ}>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                                <Trophy className="mr-2 h-4 w-4" />
                                                                Finalizar e Premiar
                                                            </DropdownMenuItem>
                                                        </FinalizeChampionshipModal>
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
                                                        Esta ação removerá permanentemente o campeonato "{champ.nome}". Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(champ.id)}>Sim, excluir</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhum campeonato encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
