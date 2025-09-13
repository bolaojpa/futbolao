
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, MoreHorizontal, Pencil, Trash2, ChevronLeft, ChevronRight, Award, AlertTriangle, Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ChampionshipForm } from '@/components/admin/championship-form';
import type { Championship, Match, UserType } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getChampionships, addChampionship, updateChampionship, deleteChampionship, getMatches, getUsers } from '@/lib/firebase/firestore';


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
    const [championships, setChampionships] = useState<Championship[]>([]);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<ChampionshipStatus>('ativo');
    const { toast } = useToast();

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [championshipsData, matchesData, usersData] = await Promise.all([
                getChampionships(),
                getMatches(),
                getUsers()
            ]);
            setChampionships(championshipsData);
            setAllMatches(matchesData);
            setAllUsers(usersData);
        } catch (error) {
            toast({ title: "Erro ao buscar dados", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        setEditingChampionship(null);
        setIsFormOpen(true);
    };

    const handleEdit = (championship: Championship) => {
        setEditingChampionship(championship);
        setIsFormOpen(true);
    };

    const handleDelete = async (championshipId: string) => {
        try {
            await deleteChampionship(championshipId);
            await fetchData();
            toast({
                title: "Campeonato Excluído",
                description: "O campeonato foi removido com sucesso.",
            });
        } catch (error) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    };

    const handleArchive = async (championshipId: string, status: 'ativo' | 'arquivado') => {
        const newStatus = status === 'ativo' ? 'arquivado' : 'ativo';
        try {
            await updateChampionship(championshipId, { status: newStatus });
            await fetchData();
            toast({
                title: `Campeonato ${newStatus === 'arquivado' ? 'Arquivado' : 'Restaurado'}`,
                description: `O campeonato foi movido para os ${newStatus === 'arquivado' ? 'arquivados' : 'ativos'}.`,
            });
        } catch (error) {
            toast({ title: "Erro ao arquivar/restaurar", variant: "destructive" });
        }
    }

    const handleFinalize = async (championship: Championship) => {
        if (championship.banner.ativo) {
            const isRankingFilled = championship.finalRanking && Object.values(championship.finalRanking).some(v => !!v);
            if (!isRankingFilled) {
                 toast({
                    title: "Finalização Pendente",
                    description: "Para gerar o banner, é necessário definir a classificação final do campeonato. Edite o campeonato e preencha a seção 'Banner'.",
                    variant: "destructive",
                    duration: 10000,
                });
                return;
            }
        }

        try {
            await updateChampionship(championship.id, { status: 'arquivado' });
             await fetchData();
            if (championship.banner.ativo) {
                // Lógica de Hall da Fama (pode ser expandida no futuro)
                toast({
                    title: "Campeonato Finalizado e Banner Criado!",
                    description: `O campeonato "${championship.nome}" foi finalizado e um banner foi adicionado ao Hall da Fama.`,
                });
            } else {
                toast({
                    title: "Campeonato Finalizado",
                    description: `O campeonato "${championship.nome}" foi finalizado e movido para os arquivados.`,
                });
            }
        } catch (error) {
            toast({ title: "Erro ao finalizar", variant: "destructive" });
        }
    };

    const handleFormSubmit = async (data: Omit<Championship, 'status'>) => {
        try {
            if (data.id) {
                // Editando campeonato existente
                await updateChampionship(data.id, {
                    ...data,
                    dataInicio: (data.dataInicio as Date).toISOString(),
                    dataFim: (data.dataFim as Date).toISOString(),
                });
                toast({
                    title: "Campeonato Atualizado",
                    description: `O campeonato "${data.nome}" foi atualizado.`,
                });
            } else {
                // Criando novo campeonato
                await addChampionship({
                    ...data,
                    dataInicio: (data.dataInicio as Date).toISOString(),
                    dataFim: (data.dataFim as Date).toISOString(),
                });
                toast({
                    title: "Campeonato Criado!",
                    description: `O campeonato "${data.nome}" foi adicionado.`,
                });
            }
            await fetchData();
        } catch (error) {
            console.error("Error saving championship: ", error);
            toast({ title: `Erro ao salvar campeonato`, description: "Verifique o console para mais detalhes.", variant: 'destructive' });
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


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

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
                        allMatches={allMatches}
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
                                handleFinalize={handleFinalize}
                                handleDelete={handleDelete}
                                handleArchive={handleArchive}
                                isLoading={isLoading}
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
                                handleFinalize={handleFinalize}
                                handleDelete={handleDelete}
                                handleArchive={handleArchive}
                                isLoading={isLoading}
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
    isLoading: boolean;
    handleEdit: (championship: Championship) => void;
    handleFinalize: (championship: Championship) => void;
    handleDelete: (championshipId: string) => void;
    handleArchive: (championshipId: string, status: 'ativo' | 'arquivado') => void;
}


function ChampionshipTable({ championships, isLoading, handleEdit, handleFinalize, handleDelete, handleArchive }: ChampionshipTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nome do Campeonato</TableHead>
                    <TableHead className="hidden sm:table-cell">Data de Início</TableHead>
                    <TableHead className="hidden sm:table-cell">Data de Fim</TableHead>
                    <TableHead className="text-center">Ações Principais</TableHead>
                    <TableHead className="text-right">Outras Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={`loading-${index}`}>
                            <TableCell colSpan={5} className="h-16">
                                 <div className="h-6 bg-muted rounded-md animate-pulse"></div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : championships.length > 0 ? (
                    championships.map(champ => (
                        <TableRow key={champ.id}>
                            <TableCell className="font-medium">{champ.nome}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <FormattedDate dateString={champ.dataInicio as string} />
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <FormattedDate dateString={champ.dataFim as string} />
                            </TableCell>
                             <TableCell className="text-center">
                                {champ.status === 'ativo' ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="default" size="sm">
                                                <Award className="mr-2 h-4 w-4" />
                                                Finalizar
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-amber-500" />Finalizar "{champ.nome}"?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação é irreversível. O campeonato será movido para os arquivados, e o banner de campeão será gerado (se ativado).
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleFinalize(champ)}>Sim, finalizar</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : (
                                     <Button variant="outline" size="sm" onClick={() => handleArchive(champ.id, champ.status)}>
                                        <ArchiveRestore className="mr-2 h-4 w-4" />
                                        Restaurar
                                    </Button>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
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
                                        <DropdownMenuItem onClick={() => handleArchive(champ.id, champ.status)}>
                                            {champ.status === 'ativo' ? <Archive className="mr-2 h-4 w-4" /> : <ArchiveRestore className="mr-2 h-4 w-4" />}
                                            {champ.status === 'ativo' ? 'Arquivar' : 'Restaurar'}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
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
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            Nenhum campeonato encontrado.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
