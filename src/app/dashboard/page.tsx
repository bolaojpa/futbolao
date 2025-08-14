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
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, CheckCircle, Percent } from 'lucide-react';
import { mockUser, mockMatches } from '@/lib/data';

export default function DashboardPage() {
  const { apelido } = mockUser;
  const stats = [
    { title: 'Posição no Ranking', value: '3º', icon: Trophy, color: 'text-amber-500' },
    { title: 'Pontos Totais', value: '125', icon: Star, color: 'text-yellow-500' },
    { title: 'Palpites Certos', value: '10', icon: CheckCircle, color: 'text-green-500' },
    { title: 'Taxa de Acerto', value: '68%', icon: Percent, color: 'text-blue-500' },
  ];

  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Bem-vindo, {apelido}!</h1>
        <p className="text-muted-foreground">Aqui está um resumo do seu desempenho.</p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Resultados Recentes</CardTitle>
          <CardDescription>Confira suas pontuações nas últimas partidas finalizadas.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Badge variant={match.pontosObtidos > 0 ? (match.pontosObtidos >= 10 ? 'default' : 'secondary') : 'destructive'} className={match.pontosObtidos >= 10 ? 'bg-green-600 text-white' : ''}>
                      {match.pontosObtidos} pts
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
