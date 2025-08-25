
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockLogs } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileClock, User, Shield, LogIn, LogOut, Edit, MessageSquareWarning, Trophy, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 10;

const actionConfig = {
    login: { icon: LogIn, color: 'text-green-500', label: 'Login' },
    login_fail: { icon: LogOut, color: 'text-destructive', label: 'Login (Falha)' },
    prediction_update: { icon: Edit, color: 'text-blue-500', label: 'Palpite' },
    profile_update: { icon: User, color: 'text-purple-500', label: 'Perfil' },
    user_management: { icon: Shield, color: 'text-amber-500', label: 'Gestão de Usuário' },
    championship_create: { icon: Trophy, color: 'text-yellow-600', label: 'Campeonato' },
    emergency_message: { icon: MessageSquareWarning, color: 'text-red-600', label: 'Aviso Urgente' },
    default: { icon: FileClock, color: 'text-muted-foreground', label: 'Outro' },
};

type ActionType = keyof typeof actionConfig;

// Componente para evitar erro de hidratação com datas
const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <>{formattedDate}</>;
};

export default function AdminLogsPage() {
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const filteredLogs = useMemo(() => {
        return mockLogs.filter(log => {
            const typeMatch = filterType === 'all' || log.action === filterType;
            const searchMatch = searchTerm === '' || 
                                log.actor.apelido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.details.toLowerCase().includes(searchTerm.toLowerCase());
            return typeMatch && searchMatch;
        });
    }, [filterType, searchTerm]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = filteredLogs.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    
    const uniqueActionTypes = useMemo(() => [...new Set(mockLogs.map(log => log.action))], []);

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <FileClock className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Logs de Atividades</h1>
                    <p className="text-muted-foreground">Monitore todas as ações realizadas no sistema.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                         <CardTitle>Registros</CardTitle>
                         <div className="flex gap-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar em detalhes ou usuário..."
                                    className="pl-8 sm:w-[200px] md:w-[280px]"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                             <Select value={filterType} onValueChange={(v) => {
                                 setFilterType(v);
                                 setCurrentPage(1);
                             }}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Filtrar por ação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Ações</SelectItem>
                                    {uniqueActionTypes.map(action => (
                                        <SelectItem key={action} value={action}>
                                            {actionConfig[action as ActionType]?.label || action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                         </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Data e Hora</TableHead>
                                <TableHead className="w-[180px]">Autor</TableHead>
                                <TableHead className="w-[180px]">Ação</TableHead>
                                <TableHead>Detalhes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLogs.length > 0 ? (
                                paginatedLogs.map(log => {
                                    const config = actionConfig[log.action as ActionType] || actionConfig.default;
                                    const Icon = config.icon;
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs">
                                                <FormattedDate dateString={log.timestamp} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {log.actor.type === 'admin' ? (
                                                        <Shield className="h-4 w-4 text-destructive" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium">{log.actor.apelido}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={config.color}>
                                                    <Icon className="h-3 w-3 mr-1.5" />
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{log.details}</TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Nenhum registro encontrado para os filtros selecionados.
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
