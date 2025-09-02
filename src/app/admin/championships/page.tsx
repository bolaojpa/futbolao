
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockChampionships as initialChampionships } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChampionshipForm } from '@/components/admin/championship-form';
import type { Championship } from '@/lib/data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const ITEMS_PER_PAGE = 10;
type ChampionshipStatus = 'ativo' | 'arquivado';

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


export default function AdminChampionshipsPage() {
    const [championships, setChampionships] = useState<Championship[]>(initialChampionships);
    const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<ChampionshipStatus>('ativo');
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

    const handleArchive = (championship: Championship) => {
        const newStatus: ChampionshipStatus = championship.status === 'ativo' ? 'arquivado' : 'ativo';
        setChampionships(prev => prev.map(c => c.id === championship.id ? { ...c, status: newStatus } : c));
        toast({
            title: `Campeonato ${newStatus === 'ativo' ? 'Restaurado' : 'Arquivado'}`,
            description: `O campeonato "${championship.nome}" foi movido para os ${newStatus}s.`,
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

    const filteredChampionships = useMemo(() => 
        [...championships]
            .filter(c => c.status === activeTab)
            .sort((a, b) => new Date(b.dataInicio as string).getTime() - new Date(a.dataInicio as string).getTime())
    , [championships, activeTab]);

    const totalPages = Math.ceil(filteredChampionships.length / ITEMS_PER_PAGE);
    const paginatedChampionships = filteredChampionships.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);


    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Trophy className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gerenciar Campeonatos</h1>
                    <p className="text-muted-foreground">Crie, edite e organize os campeonatos do seu bolão.</p>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ChampionshipStatus)}>
                 <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                    <TabsList>
                        <TabsTrigger value="ativo">Ativos</TabsTrigger>
                        <TabsTrigger value="arquivado">Arquivados</TabsTrigger>
                    </TabsList>
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
                <TabsContent value="ativo">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campeonatos Ativos</CardTitle>
                            <CardDescription>
                                Um total de {filteredChampionships.length} campeonatos ativos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChampionshipTable
                                championships={paginatedChampionships}
                                handleEdit={handleEdit}
                                handleArchive={handleArchive}
                                handleDelete={handleDelete}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="arquivado">
                     <Card>
                        <CardHeader>
                            <CardTitle>Campeonatos Arquivados</CardTitle>
                            <CardDescription>
                                Um total de {filteredChampionships.length} campeonatos arquivados.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChampionshipTable
                                championships={paginatedChampionships}
                                handleEdit={handleEdit}
                                handleArchive={handleArchive}
                                handleDelete={handleDelete}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>


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


interface ChampionshipTableProps {
    championships: Championship[];
    handleEdit: (championship: Championship) => void;
    handleArchive: (championship: Championship) => void;
    handleDelete: (championshipId: string) => void;
}


function ChampionshipTable({ championships, handleEdit, handleArchive, handleDelete }: ChampionshipTableProps) {
    return (
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
                {championships.length > 0 ? (
                    championships.map(champ => (
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
                                             <DropdownMenuItem onClick={() => handleArchive(champ)}>
                                                {champ.status === 'ativo' ? (
                                                    <>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Arquivar
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                                        Restaurar
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
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
    )
}
