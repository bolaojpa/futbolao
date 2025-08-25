

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockUsers, UserType } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Search, MoreHorizontal, UserCheck, UserX, ShieldCheck, ShieldX, CheckCircle, ShieldQuestion, CircleSlash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { StatusIndicator } from '@/components/shared/status-indicator';

const statusConfig = {
    ativo: { label: 'Ativo', color: 'bg-green-500', icon: CheckCircle },
    pendente: { label: 'Pendente', color: 'bg-yellow-500', icon: ShieldQuestion },
    bloqueado: { label: 'Bloqueado', color: 'bg-destructive', icon: CircleSlash },
};

const roleConfig = {
    usuario: { label: 'Usuário', icon: Users },
    moderador: { label: 'Moderador', icon: ShieldCheck },
    admin: { label: 'Admin', icon: ShieldX },
}

const FormattedDate = ({ dateString }: { dateString: string }) => {
    const [formattedDate, setFormattedDate] = useState('');
  
    useEffect(() => {
      setFormattedDate(format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR }));
    }, [dateString]);
  
    if (!formattedDate) {
      return null; 
    }
  
    return <>{formattedDate}</>;
};

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<UserType[]>(mockUsers);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const handleStatusChange = (userId: string, newStatus: UserType['status']) => {
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, status: newStatus } : user));
        toast({
            title: "Status do Usuário Alterado",
            description: `O status do usuário foi alterado para ${statusConfig[newStatus].label}.`,
        });
    };

    const handleRoleChange = (userId: string, newRole: UserType['funcao']) => {
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, funcao: newRole } : user));
        toast({
            title: "Função do Usuário Alterada",
            description: `O usuário agora tem a função de ${roleConfig[newRole].label}.`,
        });
    }

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const statusMatch = filterStatus === 'all' || user.status === filterStatus;
            const searchMatch = searchTerm === '' || 
                                user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                user.apelido.toLowerCase().includes(searchTerm.toLowerCase());
            return statusMatch && searchMatch;
        }).sort((a, b) => new Date(b.dataCadastro).getTime() - new Date(a.dataCadastro).getTime());
    }, [filterStatus, searchTerm, users]);

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gerenciamento de Usuários</h1>
                    <p className="text-muted-foreground">Aprove, bloqueie e gerencie os participantes do bolão.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuários</CardTitle>
                    <CardDescription>
                        Um total de {users.length} usuários cadastrados.
                    </CardDescription>
                     <div className="flex flex-col md:flex-row gap-2 pt-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nome ou apelido..."
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="ativo">Ativos</SelectItem>
                                <SelectItem value="pendente">Pendentes</SelectItem>
                                <SelectItem value="bloqueado">Bloqueados</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuário</TableHead>
                                <TableHead className="hidden sm:table-cell">Função</TableHead>
                                <TableHead className="hidden md:table-cell">Data de Cadastro</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => {
                                    const RoleIcon = roleConfig[user.funcao].icon;
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Link href={`/dashboard/profile?userId=${user.id}`} className="flex items-center gap-3 group">
                                                    <div className="relative">
                                                        <Avatar className="w-9 h-9">
                                                            <AvatarImage src={user.fotoPerfil} alt={user.apelido} />
                                                            <AvatarFallback>{user.apelido.substring(0, 2)}</AvatarFallback>
                                                        </Avatar>
                                                        <StatusIndicator status={user.presenceStatus} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium group-hover:underline">{user.apelido}</p>
                                                        <p className="text-xs text-muted-foreground hidden md:block">{user.nome}</p>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="outline">
                                                    <RoleIcon className="h-4 w-4 mr-1.5" />
                                                    {roleConfig[user.funcao].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <FormattedDate dateString={user.dataCadastro} />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-normal">
                                                    <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig[user.status].color}`} />
                                                    {statusConfig[user.status].label}
                                                </Badge>
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
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {user.status === 'pendente' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'ativo')}>
                                                                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                                                <span>Aprovar Cadastro</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.status === 'ativo' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'bloqueado')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <UserX className="mr-2 h-4 w-4" />
                                                                <span>Bloquear Usuário</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                         {user.status === 'bloqueado' && (
                                                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'ativo')}>
                                                                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                                                <span>Desbloquear Usuário</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        {user.funcao === 'usuario' && (
                                                             <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'moderador')}>
                                                                <ShieldCheck className="mr-2 h-4 w-4 text-blue-500"/>
                                                                <span>Promover a Moderador</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.funcao === 'moderador' && (
                                                             <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'usuario')} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <ShieldX className="mr-2 h-4 w-4" />
                                                                <span>Rebaixar a Usuário</span>
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum usuário encontrado para os filtros selecionados.
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

