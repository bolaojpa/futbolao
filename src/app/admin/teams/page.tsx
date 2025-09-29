

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, PlusCircle, Import, Trash2, Loader2, AlertTriangle, Database, DatabaseZap, Pencil, Save, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { Team } from '@/lib/types';
import { getTeams, addTeam, deleteTeams, updateTeam } from '@/lib/firebase/firestore';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { predefinedTeams } from '@/lib/predefined-teams';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function AdminTeamsPage() {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [manualTeamName, setManualTeamName] = useState('');
    const [manualTeamCrest, setManualTeamCrest] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [clubFilter, setClubFilter] = useState('all');
    const [nationalFilter, setNationalFilter] = useState('all');

    const fetchTeams = async () => {
        setIsFetching(true);
        try {
            const fetchedTeams = await getTeams();
            setTeams(fetchedTeams);
        } catch (error) {
            toast({ title: "Erro ao buscar equipes", description: "Não foi possível carregar a lista de equipes do banco de dados.", variant: "destructive" });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleInitialLoad = async () => {
        setIsLoading(true);
        let teamsAdded = 0;
        let teamsSkipped = 0;
        const currentTeams = await getTeams();

        try {
            for (const teamData of predefinedTeams) {
                if (!currentTeams.some(et => et.name === teamData.name)) {
                    await addTeam(teamData);
                    teamsAdded++;
                } else {
                    teamsSkipped++;
                }
            }
            await fetchTeams();
            toast({ 
                title: "Carga Inicial Concluída!", 
                description: `${teamsAdded} equipes adicionadas. ${teamsSkipped} equipes já existentes foram ignoradas.`
            });
        } catch (error) {
            toast({ title: "Erro na Carga Inicial", description: "Ocorreu um erro ao salvar as equipes pré-definidas.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddManualTeam = async (type: 'club' | 'national') => {
        if (!manualTeamName) {
            toast({ title: "Dados Incompletos", description: "Preencha o nome da equipe.", variant: "destructive" });
            return;
        }
        const newTeam: Omit<Team, 'id'> = {
            name: manualTeamName,
            crestUrl: manualTeamCrest || `https://ui-avatars.com/api/?name=${manualTeamName.charAt(0)}&background=random&size=128`,
            type: type,
        };
        try {
            await addTeam(newTeam);
            await fetchTeams();
            toast({ title: "Equipe Adicionada!", description: `A equipe "${manualTeamName}" foi adicionada com sucesso.` });
            setManualTeamName('');
            setManualTeamCrest('');
        } catch (error) {
            toast({ title: "Erro ao Adicionar Equipe", description: "Não foi possível salvar a equipe.", variant: "destructive" });
        }
    };
    
    const handleSelectTeam = (teamId: string) => {
        setSelectedTeams(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(teamId)) {
                newSelection.delete(teamId);
            } else {
                newSelection.add(teamId);
            }
            return newSelection;
        });
    };

    const handleSelectAllOnPage = (type: 'club' | 'national', checked: boolean | 'indeterminate') => {
        const pageTeams = teams.filter(t => t.type === type);
        if (checked) {
            setSelectedTeams(prev => new Set([...prev, ...pageTeams.map(t => t.id)]));
        } else {
             setSelectedTeams(prev => {
                const newSelection = new Set(prev);
                pageTeams.forEach(t => newSelection.delete(t.id));
                return newSelection;
            });
        }
    };

    const handleDeleteSelected = async () => {
        const teamIdsToDelete = Array.from(selectedTeams);
        try {
            await deleteTeams(teamIdsToDelete);
            await fetchTeams();
            toast({
                title: "Equipes Removidas",
                description: `${selectedTeams.size} equipe(s) foram removidas permanentemente.`,
            });
            setSelectedTeams(new Set());
        } catch (error) {
             toast({
                title: "Erro ao remover equipes",
                description: "Não foi possível remover as equipes selecionadas.",
                variant: "destructive",
            });
        }
    };

    const handleOpenEditModal = (team: Team) => {
        setEditingTeam(team);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTeam) return;

        try {
            await updateTeam(editingTeam.id, {
                name: editingTeam.name,
                crestUrl: editingTeam.crestUrl,
            });
            await fetchTeams();
            toast({ title: "Equipe Atualizada", description: `Os dados de "${editingTeam.name}" foram salvos.` });
            setIsEditModalOpen(false);
            setEditingTeam(null);
        } catch (error) {
            toast({ title: "Erro ao atualizar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        }
    };

    const renderTeamTable = (type: 'club' | 'national') => {
        const currentFilter = type === 'club' ? clubFilter : nationalFilter;
        const filteredTeams = teams.filter(t => {
            if (t.type !== type) return false;
            if (currentFilter === 'all') return true;
            return t.countryOrConfederation === currentFilter || t.league === currentFilter;
        });
        
        const allOnPageSelected = filteredTeams.length > 0 && filteredTeams.every(t => selectedTeams.has(t.id));
        
        const filterOptions = Array.from(new Set(
            teams.filter(t => t.type === type).flatMap(t => [t.countryOrConfederation, t.league]).filter(Boolean)
        ));

        return (
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <CardTitle className="capitalize">{type === 'club' ? 'Clubes' : 'Seleções'} Cadastrados</CardTitle>
                            <CardDescription>
                                Exibindo {filteredTeams.length} de {teams.filter(t => t.type === type).length} equipes.
                            </CardDescription>
                        </div>
                         {selectedTeams.size > 0 && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full sm:w-auto">
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Excluir Selecionados ({selectedTeams.size})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação removerá permanentemente os {selectedTeams.size} registro(s) selecionado(s). Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteSelected}>Sim, excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                     <div className="pt-4">
                        <Select value={currentFilter} onValueChange={type === 'club' ? setClubFilter : setNationalFilter}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Filtrar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Mostrar Todos</SelectItem>
                                {filterOptions.map(option => (
                                    <SelectItem key={option} value={option!}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox 
                                        onCheckedChange={(checked) => handleSelectAllOnPage(type, checked)}
                                        checked={allOnPageSelected}
                                        aria-label="Selecionar todas as equipes nesta página"
                                    />
                                </TableHead>
                                <TableHead className="w-[80px]">Escudo</TableHead>
                                <TableHead>Nome da Equipe</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTeams.length > 0 ? (
                                filteredTeams.map(team => (
                                    <TableRow key={team.id} data-state={selectedTeams.has(team.id) ? "selected" : ""}>
                                        <TableCell>
                                             <Checkbox 
                                                checked={selectedTeams.has(team.id)}
                                                onCheckedChange={() => handleSelectTeam(team.id)}
                                                aria-label={`Selecionar equipe ${team.name}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Image src={team.crestUrl} alt={`Escudo do ${team.name}`} width={40} height={32} className="object-contain" />
                                        </TableCell>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(team)}>
                                                <Pencil className="h-4 w-4" />
                                                <span className="sr-only">Editar</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <p className="font-semibold">Nenhuma equipe encontrada.</p>
                                        <p className="text-sm text-muted-foreground">Adicione uma equipe manualmente ou importe de uma competição.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }
    
    const renderTeamManagement = (type: 'club' | 'national') => (
        <div className="grid grid-cols-1 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle /> Adicionar Manualmente</CardTitle>
                    <CardDescription>
                        Adicione uma equipe que não está disponível na lista pré-definida.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor={`team-name-${type}`}>Nome da Equipe</Label>
                        <Input id={`team-name-${type}`} placeholder="Ex: Real Madrid CF" value={manualTeamName} onChange={(e) => setManualTeamName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor={`team-crest-${type}`}>URL do Escudo (Opcional)</Label>
                        <Input id={`team-crest-${type}`} placeholder="https://example.com/escudo.png" value={manualTeamCrest} onChange={(e) => setManualTeamCrest(e.target.value)} />
                    </div>
                    <Button variant="secondary" onClick={() => handleAddManualTeam(type)}>
                        <PlusCircle className="mr-2" />
                        Adicionar {type === 'club' ? 'Time' : 'Seleção'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <>
            <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Equipes</h1>
                        <p className="text-muted-foreground">
                            Adicione, importe e gerencie os times e seleções do seu bolão.
                        </p>
                    </div>
                </div>

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><DatabaseZap /> Carga Inicial de Dados</CardTitle>
                        <CardDescription>
                            Clique no botão abaixo para popular o banco de dados com uma lista extensa de equipes. Equipes existentes não serão duplicadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleInitialLoad} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                            Fazer Carga Inicial de Equipes
                        </Button>
                    </CardContent>
                </Card>

                <Tabs defaultValue="clubs">
                    <TabsList className="grid w-full grid-cols-2 max-w-sm">
                        <TabsTrigger value="clubs">Times (Clubes)</TabsTrigger>
                        <TabsTrigger value="national">Seleções</TabsTrigger>
                    </TabsList>
                    <TabsContent value="clubs" className="space-y-8 mt-6">
                        {renderTeamManagement('club')}
                        <Separator />
                        {renderTeamTable('club')}
                    </TabsContent>
                    <TabsContent value="national" className="space-y-8 mt-6">
                        {renderTeamManagement('national')}
                        <Separator />
                        {renderTeamTable('national')}
                    </TabsContent>
                </Tabs>
            </div>
            
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Equipe</DialogTitle>
                        <DialogDescription>
                            Altere o nome e o escudo da equipe selecionada.
                        </DialogDescription>
                    </DialogHeader>
                    {editingTeam && (
                        <div className="space-y-4 py-4">
                            <div>
                                <Label htmlFor="edit-team-name">Nome da Equipe</Label>
                                <Input
                                    id="edit-team-name"
                                    value={editingTeam.name}
                                    onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit-team-crest">URL do Escudo</Label>
                                <Input
                                    id="edit-team-crest"
                                    value={editingTeam.crestUrl}
                                    onChange={(e) => setEditingTeam({ ...editingTeam, crestUrl: e.target.value })}
                                />
                            </div>
                             <div className="text-center">
                                <Image src={editingTeam.crestUrl} alt={`Escudo do ${editingTeam.name}`} width={80} height={80} className="object-contain inline-block bg-muted p-2 rounded-md" />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit}>
                            <Save className="mr-2 h-4 w-4"/>
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
