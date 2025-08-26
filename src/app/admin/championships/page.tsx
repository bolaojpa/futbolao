
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockChampionships as initialChampionships } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChampionshipForm } from '@/components/admin/championship-form';
import type { Championship } from '@/lib/data';

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
        // Adicionar toast de sucesso aqui
    };

    const handleFormSubmit = (data: Championship) => {
        if (editingChampionship) {
            // Lógica de Edição
            setChampionships(prev => prev.map(c => c.id === data.id ? data : c));
        } else {
            // Lógica de Criação
            setChampionships(prev => [...prev, data]);
        }
    };


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
                                                    <DropdownMenuItem onClick={() => handleDelete(champ.id)} className="text-destructive focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
        </div>
    );
}
