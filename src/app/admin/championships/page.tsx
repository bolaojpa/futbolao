

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockChampionships } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trophy, MoreHorizontal, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Componente para evitar erro de hidratação
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(parseISO(dateString), "dd/MM/yyyy", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <>{formattedDate}</>;
};

export default function AdminChampionshipsPage() {
    const [championships, setChampionships] = useState(mockChampionships);

    const handleEdit = (championshipId: string) => {
        // Lógica para edição será implementada aqui
        console.log("Edit:", championshipId);
    };

    const handleDelete = (championshipId: string) => {
        // Lógica para exclusão será implementada aqui
        console.log("Delete:", championshipId);
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
                         <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Criar Novo Campeonato
                        </Button>
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
                                            <FormattedDate dateString={champ.dataInicio} />
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <FormattedDate dateString={champ.dataFim} />
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
                                                    <DropdownMenuItem onClick={() => handleEdit(champ.id)}>
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
