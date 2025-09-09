

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, PlusCircle, Import, Trash2, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { fetchTeamsFromApi } from './actions';
import type { Team } from '@/lib/types';
import { getTeams, addTeam, deleteTeams } from '@/lib/firebase/firestore';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminTeamsPage() {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [competitionCode, setCompetitionCode] = useState('');
    const [manualTeamName, setManualTeamName] = useState('');
    const [manualTeamCrest, setManualTeamCrest] = useState('');
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

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

    const handleFetchTeams = async (type: 'club' | 'national') => {
        if (!competitionCode) {
            toast({ title: "Código da Competição Inválido", description: "Por favor, insira um código de competição válido.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const result = await fetchTeamsFromApi(competitionCode);
        
        if (result.error) {
            toast({ title: "Erro ao Importar", description: result.error, variant: "destructive" });
            setIsLoading(false);
        } else if (result.teams) {
            const newTeams = result.teams.map(team => ({
                name: team.name,
                crestUrl: team.crestUrl,
                type: type,
            }));

            // Adiciona as equipes ao Firestore uma a uma
            try {
                for (const teamData of newTeams) {
                    // Evita duplicados pelo nome
                    if (!teams.some(et => et.name === teamData.name)) {
                       await addTeam(teamData);
                    }
                }
                await fetchTeams(); // Re-fetch para atualizar a lista
                toast({ title: "Importação Concluída!", description: `${newTeams.length} equipes foram processadas.` });
            } catch (error) {
                toast({ title: "Erro ao Salvar Equipes", description: "Não foi possível salvar as equipes no banco de dados.", variant: "destructive" });
            } finally {
                setCompetitionCode('');
                 setIsLoading(false);
            }
        }
    };

    const handleAddManualTeam = async (type: 'club' | 'national') => {
        if (!manualTeamName || !manualTeamCrest) {
            toast({ title: "Dados Incompletos", description: "Preencha o nome e a URL do escudo.", variant: "destructive" });
            return;
        }
        const newTeam: Omit<Team, 'id'> = {
            name: manualTeamName,
            crestUrl: manualTeamCrest,
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

    const renderTeamTable = (type: 'club' | 'national') => {
        const filteredTeams = teams.filter(t => t.type === type);
        const allOnPageSelected = filteredTeams.length > 0 && filteredTeams.every(t => selectedTeams.has(t.id));

        return (
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <CardTitle className="capitalize">{type === 'club' ? 'Clubes' : 'Seleções'} Cadastrados</CardTitle>
                            <CardDescription>
                                Total de {filteredTeams.length} equipes.
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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isFetching ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
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
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Import /> Importar via API</CardTitle>
                    <CardDescription>
                        Adicione equipes de uma competição usando o código do football-data.org (ex: BSA, PL, WC).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor={`competition-code-${type}`}>Código da Competição</Label>
                        <Input id={`competition-code-${type}`} placeholder="Ex: BSA" value={competitionCode} onChange={(e) => setCompetitionCode(e.target.value.toUpperCase())} />
                    </div>
                    <Button onClick={() => handleFetchTeams(type)} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 animate-spin" /> : <Import className="mr-2" />}
                        Importar {type === 'club' ? 'Times' : 'Seleções'}
                    </Button>
                     <div className="text-xs text-muted-foreground pt-2">
                        <AlertTriangle className="inline-block h-4 w-4 mr-1" />
                        A importação pode não funcionar para todas as competições devido a limitações do plano da API.
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle /> Adicionar Manualmente</CardTitle>
                    <CardDescription>
                        Adicione uma equipe que não está disponível na API ou para casos específicos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor={`team-name-${type}`}>Nome da Equipe</Label>
                        <Input id={`team-name-${type}`} placeholder="Ex: Real Madrid CF" value={manualTeamName} onChange={(e) => setManualTeamName(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor={`team-crest-${type}`}>URL do Escudo</Label>
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
    );
}
