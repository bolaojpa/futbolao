import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, CheckCircle, Percent, Edit } from 'lucide-react';
import { mockUser, mockMatches } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { apelido, nome, email, fotoPerfil } = mockUser;
  const stats = [
    { title: 'Posição no Ranking', value: '3º', icon: Trophy, color: 'text-amber-500' },
    { title: 'Pontos Totais', value: '125', icon: Star, color: 'text-yellow-500' },
    { title: 'Palpites Certos', value: '10', icon: CheckCircle, color: 'text-green-500' },
    { title: 'Taxa de Acerto', value: '68%', icon: Percent, color: 'text-blue-500' },
  ];
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

  const getPointsBadgeVariant = (pontos: number): "success" | "default" | "destructive" => {
    if (pontos === 10) return 'success';
    if (pontos > 0) return 'default';
    return 'destructive';
  }

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <Avatar className="w-24 h-24 border-4 border-primary">
            <AvatarImage src={fotoPerfil} alt={`@${apelido}`} />
            <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
        </Avatar>
        <div className='flex-1'>
            <h1 className="text-3xl font-bold font-headline">{nome}</h1>
            <p className="text-muted-foreground text-lg">@{apelido}</p>
            <p className="text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
        </Button>
      </div>
      
      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Minhas Estatísticas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
            <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">Atualizado recentemente</p>
                </CardContent>
            </Card>
            ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold font-headline mb-4">Meus Últimos Pontos</h2>
        <Card>
            <CardContent className="p-0">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Partida</TableHead>
                    <TableHead className="text-center">Placar Final</TableHead>
                    <TableHead className="text-right">Seus Pontos</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {mockMatches.recent.map((match) => (
                    <TableRow key={match.id}>
                    <TableCell className="font-medium">{`${match.timeA} x ${match.timeB}`}</TableCell>
                    <TableCell className="text-center font-mono">{`${match.placarA} - ${match.placarB}`}</TableCell>
                    <TableCell className="text-right">
                        <Badge variant={getPointsBadgeVariant(match.pontosObtidos)}>
                            {match.pontosObtidos} pts
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </section>
    </div>
  );
}
