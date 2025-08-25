

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockLogs } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileClock, User, Shield, LogIn, LogOut, Edit, MessageSquareWarning, Trophy, ChevronLeft, ChevronRight, Search, Eye, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ITEMS_PER_PAGE = 10;
type Log = typeof mockLogs[0];

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
const FormattedDate = ({ dateString, formatString = "dd/MM/yyyy HH:mm:ss" }: { dateString: string, formatString?: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(new Date(dateString), formatString, { locale: ptBR }));
    }, [dateString, formatString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <>{formattedDate}</>;
};

export default function AdminLogsPage() {
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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

    const handleViewDetails = (log: Log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

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
                                <TableHead className="hidden md:table-cell w-[180px]">Data e Hora</TableHead>
                                <TableHead>Autor</TableHead>
                                <TableHead>Ação</TableHead>
                                <TableHead className="text-right w-[140px]">Opções</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedLogs.length > 0 ? (
                                paginatedLogs.map(log => {
                                    const config = actionConfig[log.action as ActionType] || actionConfig.default;
                                    const Icon = config.icon;
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell className="hidden md:table-cell font-mono text-xs">
                                                <FormattedDate dateString={log.timestamp} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {log.actor.type === 'admin' ? (
                                                        <Shield className="h-4 w-4 text-destructive" />
                                                    ) : log.actor.type === 'moderator' ? (
                                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <div className='flex flex-col'>
                                                        <span className="font-medium">{log.actor.apelido}</span>
                                                        <span className='md:hidden text-xs text-muted-foreground'>
                                                            <FormattedDate dateString={log.timestamp} formatString="dd/MM/yy HH:mm" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={config.color}>
                                                    <Icon className="h-3 w-3 mr-1.5" />
                                                    {config.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(log)}>
                                                    <Eye className="h-4 w-4 mr-2"/>
                                                    Ver Detalhes
                                                </Button>
                                            </TableCell>
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
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalhes do Log</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                         <div className="space-y-4 py-2">
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Data e Hora</h4>
                                 <p><FormattedDate dateString={selectedLog.timestamp} /></p>
                             </div>
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Autor</h4>
                                 <p>{selectedLog.actor.apelido} ({selectedLog.actor.type})</p>
                             </div>
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Ação</h4>
                                 <p>{actionConfig[selectedLog.action as ActionType]?.label || 'Outra'}</p>
                             </div>
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Detalhes</h4>
                                 <p>{selectedLog.details}</p>
                             </div>
                         </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
