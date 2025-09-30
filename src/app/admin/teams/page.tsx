

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Shield, PlusCircle, Import, Trash2, Loader2, AlertTriangle, Database, DatabaseZap, Pencil, Save, X, Search, ChevronLeft, ChevronRight, Globe, Flag } from 'lucide-react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const ITEMS_PER_PAGE = 10;

export default function AdminTeamsPage() {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set());

    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const [clubConfederationFilter, setClubConfederationFilter] = useState('all');
    const [clubCountryFilter, setClubCountryFilter] = useState('all');
    const [nationalFilter, setNationalFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPageClubs, setCurrentPageClubs] = useState(1);
    const [currentPageNationals, setCurrentPageNationals] = useState(1);


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

    const handleAddClick = () => {
        setEditingTeam(null);
        setIsFormOpen(true);
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

    const handleSelectAllOnPage = (type: 'club' | 'national', paginatedTeams: Team[], checked: boolean | 'indeterminate') => {
        if (checked) {
            setSelectedTeams(prev => new Set([...prev, ...paginatedTeams.map(t => t.id)]));
        } else {
             setSelectedTeams(prev => {
                const newSelection = new Set(prev);
                paginatedTeams.forEach(t => newSelection.delete(t.id));
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
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (teamData: Omit<Team, 'id' | 'type'>, type: 'club' | 'national') => {
        try {
            if (editingTeam) {
                // Update
                await updateTeam(editingTeam.id, { ...teamData, type });
                toast({ title: "Equipe Atualizada", description: `Os dados de "${teamData.name}" foram salvos.` });
            } else {
                // Create
                const crestUrl = teamData.crestUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.name)}&background=random&size=128`;
                await addTeam({ ...teamData, crestUrl, type });
                toast({ title: "Equipe Adicionada!", description: `A equipe "${teamData.name}" foi adicionada com sucesso.` });
            }
            await fetchTeams();
            return true; // Indicate success
        } catch (error) {
            toast({ title: `Erro ao salvar equipe`, description: "Não foi possível salvar os dados.", variant: "destructive" });
            return false; // Indicate failure
        }
    };
    
    const clubConfederationOptions = useMemo(() => Array.from(new Set(
        teams.filter(t => t.type === 'club' && t.countryOrConfederation).map(t => {
             const parts = (t.countryOrConfederation || '').split('/');
             return parts.length > 1 ? parts[0].trim() : 'Outros';
        })
    )).sort(), [teams]);

    const clubCountryOptions = useMemo(() => {
        if (clubConfederationFilter === 'all') return [];
        return Array.from(new Set(
            teams.filter(t => t.type === 'club' && t.countryOrConfederation && (t.countryOrConfederation.startsWith(clubConfederationFilter) || (clubConfederationFilter === 'Outros' && !t.countryOrConfederation.includes('/'))))
            .map(t => {
                const parts = (t.countryOrConfederation || '').split('/');
                return parts.length > 1 ? parts[1].trim() : parts[0].trim();
            })
        )).sort();
    }, [teams, clubConfederationFilter]);


    const renderTeamTable = (type: 'club' | 'national') => {
        const isClub = type === 'club';
        const currentPage = isClub ? currentPageClubs : currentPageNationals;
        const setCurrentPage = isClub ? setCurrentPageClubs : setCurrentPageNationals;

        const filteredTeams = teams.filter(t => {
            if (t.type !== type) return false;
            
            let confederationMatch = true;
            let countryMatch = true;

            if (isClub) {
                confederationMatch = clubConfederationFilter === 'all' || 
                                     (t.countryOrConfederation && t.countryOrConfederation.startsWith(clubConfederationFilter)) ||
                                     (clubConfederationFilter === 'Outros' && t.countryOrConfederation && !t.countryOrConfederation.includes('/'));
                countryMatch = clubCountryFilter === 'all' || 
                               (t.countryOrConfederation && t.countryOrConfederation.includes(clubCountryFilter));
            } else {
                confederationMatch = nationalFilter === 'all' || t.countryOrConfederation === nationalFilter;
            }

            const searchMatch = searchTerm === '' || t.name.toLowerCase().includes(searchTerm.toLowerCase());
            return confederationMatch && countryMatch && searchMatch;
        });

        const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
        const paginatedTeams = filteredTeams.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
        
        const allOnPageSelected = paginatedTeams.length > 0 && paginatedTeams.every(t => selectedTeams.has(t.id));
        
        const filterOptions = Array.from(new Set(
            teams.filter(t => t.type === type).map(t => t.countryOrConfederation).filter(Boolean)
        )).sort();

        return (
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <CardTitle className="capitalize">{type === 'club' ? 'Clubes' : 'Seleções'} Cadastrados</CardTitle>
                            <CardDescription>
                                Exibindo {paginatedTeams.length} de {filteredTeams.length} equipes.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            {selectedTeams.size > 0 && teams.some(t => selectedTeams.has(t.id) && t.type === type) && (
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
                             <Button onClick={handleAddClick} className="w-full sm:w-auto">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Equipe
                            </Button>
                        </div>
                    </div>
                     <div className="pt-4 flex flex-col md:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome..."
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                         {isClub ? (
                            <>
                                <Select value={clubConfederationFilter} onValueChange={(v) => {setClubConfederationFilter(v); setClubCountryFilter('all'); setCurrentPage(1);}}>
                                    <SelectTrigger className="w-full md:w-[220px]">
                                        <SelectValue placeholder="Filtrar Confederação..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas as Confederações</SelectItem>
                                        {clubConfederationOptions.map(option => (
                                            <SelectItem key={option} value={option}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <Select value={clubCountryFilter} onValueChange={(v) => {setClubCountryFilter(v); setCurrentPage(1);}} disabled={clubConfederationFilter === 'all'}>
                                    <SelectTrigger className="w-full md:w-[220px]">
                                        <SelectValue placeholder="Filtrar País..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os Países</SelectItem>
                                        {clubCountryOptions.map(option => (
                                            <SelectItem key={option} value={option!}>{option}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </>
                        ) : (
                             <Select value={nationalFilter} onValueChange={(v) => {setNationalFilter(v); setCurrentPage(1);}}>
                                <SelectTrigger className="w-full md:w-[280px]">
                                    <SelectValue placeholder="Filtrar por Confederação..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Confederações</SelectItem>
                                    {filterOptions.map(option => (
                                        <SelectItem key={option} value={option!}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox 
                                        onCheckedChange={(checked) => handleSelectAllOnPage(type, paginatedTeams, checked)}
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
                            ) : paginatedTeams.length > 0 ? (
                                paginatedTeams.map(team => (
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
                {totalPages > 1 && (
                    <CardContent>
                         <div className="flex items-center justify-center gap-4 mt-4">
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
                    </CardContent>
                )}
            </Card>
        );
    }

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
                        {renderTeamTable('club')}
                    </TabsContent>
                    <TabsContent value="national" className="space-y-8 mt-6">
                        {renderTeamTable('national')}
                    </TabsContent>
                </Tabs>
            </div>
            
            <TeamFormDialog 
                isOpen={isFormOpen} 
                setIsOpen={setIsFormOpen} 
                team={editingTeam}
                onSubmit={handleFormSubmit}
            />
        </>
    );
}

// Separate component for the form dialog
interface TeamFormDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    team: Team | null;
    onSubmit: (data: Omit<Team, 'id'|'type'>, type: 'club' | 'national') => Promise<boolean>;
}

function TeamFormDialog({ isOpen, setIsOpen, team, onSubmit }: TeamFormDialogProps) {
    const [teamType, setTeamType] = useState<'club' | 'national'>('club');
    const [isLoading, setIsLoading] = useState(false);

    const formSchema = z.object({
        name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
        crestUrl: z.string().url("Por favor, insira uma URL válida.").optional().or(z.literal('')),
        countryOrConfederation: z.string().min(1, "Este campo é obrigatório."),
        league: z.string().optional(),
    });

    type FormValues = z.infer<typeof formSchema>;
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', crestUrl: '', countryOrConfederation: '', league: '' },
    });

    useEffect(() => {
        if (team) {
            setTeamType(team.type);
            form.reset({
                name: team.name,
                crestUrl: team.crestUrl,
                countryOrConfederation: team.countryOrConfederation,
                league: team.league
            });
        } else {
            form.reset({ name: '', crestUrl: '', countryOrConfederation: '', league: '' });
            setTeamType('club');
        }
    }, [team, form, isOpen]);

    const title = team ? 'Editar Equipe' : 'Adicionar Nova Equipe';
    const description = team ? 'Altere os dados da equipe selecionada.' : 'Preencha os dados para adicionar uma nova equipe.';
    
    const handleFormSubmit = async (data: FormValues) => {
        setIsLoading(true);
        const success = await onSubmit(data, teamType);
        if (success) {
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                        {!team && (
                             <Select value={teamType} onValueChange={(v) => setTeamType(v as 'club' | 'national')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tipo de Equipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="club">Clube</SelectItem>
                                    <SelectItem value="national">Seleção Nacional</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Equipe</FormLabel>
                                    <Input {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="crestUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>URL do Escudo</FormLabel>
                                    <Input {...field} />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="countryOrConfederation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{teamType === 'club' ? 'Confederação / País' : 'Confederação'}</FormLabel>
                                    <Input {...field} placeholder={teamType === 'club' ? 'Ex: CONMEBOL / Brasil' : 'Ex: CONMEBOL'}/>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {teamType === 'club' && (
                            <FormField
                                control={form.control}
                                name="league"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Liga (Opcional)</FormLabel>
                                        <Input {...field} placeholder="Ex: Brasileirão Série A" />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                               {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
