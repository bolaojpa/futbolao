

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockLogs, Log } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileClock, User, Shield, LogIn, LogOut, Edit, MessageSquareWarning, Trophy, ChevronLeft, ChevronRight, Search, Eye, ShieldCheck, Trash2, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';


const ITEMS_PER_PAGE = 10;

const actionConfig = {
    login: { icon: LogIn, color: 'text-green-500', label: 'Login' },
    login_fail: { icon: LogOut, color: 'text-destructive', label: 'Login (Falha)' },
    prediction_update: { icon: Edit, color: 'text-blue-500', label: 'Palpite' },
    profile_update: { icon: User, color: 'text-purple-500', label: 'Perfil' },
    user_management: { icon: Shield, color: 'text-amber-500', label: 'Gestão de Usuário' },
    championship_create: { icon: Trophy, color: 'text-yellow-600', label: 'Campeonato' },
    emergency_message: { icon: MessageSquareWarning, color: 'text-red-600', label: 'Aviso Urgente' },
    ai_notification: { icon: Bot, color: 'text-teal-500', label: 'Notificação de IA' },
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
    const { toast } = useToast();
    const [logs, setLogs] = useState<Log[]>(mockLogs);
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
    
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const typeMatch = filterType === 'all' || log.action === filterType;
            const searchMatch = searchTerm === '' || 
                                log.actor.apelido.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (typeof log.details === 'string' && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
            return typeMatch && searchMatch;
        });
    }, [filterType, searchTerm, logs]);

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

    const handleSelectLog = (logId: string) => {
        setSelectedLogs(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(logId)) {
                newSelection.delete(logId);
            } else {
                newSelection.add(logId);
            }
            return newSelection;
        });
    };

    const handleSelectAllOnPage = (checked: boolean | 'indeterminate') => {
        if (checked) {
            setSelectedLogs(prev => new Set([...prev, ...paginatedLogs.map(l => l.id)]));
        } else {
             setSelectedLogs(prev => {
                const newSelection = new Set(prev);
                paginatedLogs.forEach(l => newSelection.delete(l.id));
                return newSelection;
            });
        }
    };

    const handleDeleteSelected = () => {
        setLogs(prev => prev.filter(log => !selectedLogs.has(log.id)));
        toast({
            title: "Logs Excluídos",
            description: `${selectedLogs.size} registro(s) de log foram removidos permanentemente.`,
        });
        setSelectedLogs(new Set());
    };
    
    const renderLogDetails = (log: Log) => {
        if ((log.action === 'emergency_message' || log.action === 'ai_notification') && typeof log.details === 'object' && log.details !== null) {
            const details = log.details as { title: string; message: string; target?: string };
            return (
                <div className="space-y-4">
                    <div className='bg-muted p-3 rounded-md'>
                        <h4 className="font-semibold text-sm">Título da Mensagem</h4>
                        <p className="text-sm">{details.title}</p>
                    </div>
                    <div className='bg-muted p-3 rounded-md'>
                        <h4 className="font-semibold text-sm">Conteúdo da Mensagem</h4>
                        <p className="text-sm whitespace-pre-wrap">{details.message}</p>
                    </div>
                     {details.target && (<div className='bg-muted p-3 rounded-md'>
                        <h4 className="font-semibold text-sm">Alvo</h4>
                        <p className="text-sm capitalize">{details.target}</p>
                    </div>)}
                </div>
            );
        }
        
        if (typeof log.details === 'string') {
            return <p>{log.details}</p>;
        }

        return <p>Não foi possível exibir os detalhes deste log.</p>;
    }


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
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex-1">
                            <CardTitle>Registros</CardTitle>
                            <CardDescription>Ações recentes realizadas no sistema.</CardDescription>
                        </div>
                         {selectedLogs.size > 0 && (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full sm:w-auto">
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Excluir Selecionados ({selectedLogs.size})
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação removerá permanentemente os {selectedLogs.size} registro(s) selecionado(s). Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteSelected}>Sim, excluir logs</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                         )}
                    </div>
                     <div className="flex flex-col md:flex-row gap-2 pt-6">
                         <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por usuário..."
                                className="pl-8 w-full"
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
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                     <Checkbox 
                                        onCheckedChange={handleSelectAllOnPage}
                                        checked={paginatedLogs.length > 0 && paginatedLogs.every(l => selectedLogs.has(l.id))}
                                        aria-label="Selecionar todos os logs nesta página"
                                     />
                                </TableHead>
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
                                        <TableRow key={log.id} data-state={selectedLogs.has(log.id) ? "selected" : ""}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={selectedLogs.has(log.id)}
                                                    onCheckedChange={() => handleSelectLog(log.id)}
                                                    aria-label={`Selecionar log de ${log.actor.apelido}`}
                                                />
                                            </TableCell>
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
                                    <TableCell colSpan={5} className="h-24 text-center">
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
                        <DialogDescription>Informações completas sobre a ação registrada.</DialogDescription>
                    </DialogHeader>
                    {selectedLog && (
                         <div className="space-y-4 py-2">
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Data e Hora</h4>
                                 <p><FormattedDate dateString={selectedLog.timestamp} /></p>
                             </div>
                              <Separator />
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Autor</h4>
                                 <p>{selectedLog.actor.apelido} ({selectedLog.actor.type})</p>
                             </div>
                              <Separator />
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Ação</h4>
                                 <p>{actionConfig[selectedLog.action as ActionType]?.label || 'Outra'}</p>
                             </div>
                             <Separator />
                             <div>
                                 <h4 className="font-semibold text-sm text-muted-foreground">Detalhes</h4>
                                 {renderLogDetails(selectedLog)}
                             </div>
                         </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
