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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockUsers, mockUser } from '@/lib/data';
import { Medal, Award, Flashlight } from 'lucide-react';
import { Confetti } from '@/components/leaderboard/confetti';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

export default function LeaderboardPage() {
  // Tie-breaking logic as described
  const sortedUsers = [...mockUsers].sort((a, b) => {
    if (a.pontos !== b.pontos) return b.pontos - a.pontos;
    if (a.exatos !== b.exatos) return b.exatos - a.exatos;
    if (a.tempoMedio !== b.tempoMedio) return a.tempoMedio - b.tempoMedio;
    return new Date(a.dataCadastro).getTime() - new Date(b.dataCadastro).getTime();
  });

  const getMedal = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Award className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700" />;
    if (rank === sortedUsers.length) return <Flashlight className="w-6 h-6 text-gray-400" />;
    return <span className="text-sm font-medium">{rank}º</span>;
  };
  
  const shareText = encodeURIComponent(`Confira o ranking do FutBolão Pro! Estou em ${sortedUsers.findIndex(u => u.id === mockUser.id) + 1}º lugar!`);

  return (
    <div className="container mx-auto space-y-8 relative">
      <Confetti />
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline">Ranking de Jogadores</h1>
            <p className="text-muted-foreground">Veja quem são os mestres dos palpites.</p>
        </div>
         <div className="flex gap-2">
            <Button variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
            </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        {sortedUsers.slice(0, 3).map((user, index) => (
            <Card key={user.id} className={cn(
                "relative overflow-hidden",
                index === 1 && "md:order-1", // 2nd place
                index === 0 && "md:order-2 md:scale-105", // 1st place
                index === 2 && "md:order-3", // 3rd place
            )}>
                 <CardHeader>
                    <div className={cn(
                        "w-24 h-24 rounded-full mx-auto p-1",
                        index === 0 && "bg-gradient-to-tr from-yellow-400 to-amber-600 animate-leader-pulse",
                        index === 1 && "bg-gradient-to-tr from-slate-300 to-slate-500",
                        index === 2 && "bg-gradient-to-tr from-amber-600 to-yellow-700",
                    )}>
                        <Avatar className="w-full h-full border-4 border-background">
                            <AvatarImage src={`https://placehold.co/100x100.png?text=${user.apelido.charAt(0)}`} alt={user.apelido} />
                            <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                        </Avatar>
                    </div>
                     <CardTitle className="mt-4 text-2xl font-headline">{user.apelido}</CardTitle>
                    <CardDescription className="text-lg font-bold text-primary">{user.pontos} pts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center text-3xl">
                        {index === 0 && <Medal className="w-10 h-10 text-yellow-500" />}
                        {index === 1 && <Award className="w-10 h-10 text-slate-400" />}
                        {index === 2 && <Award className="w-10 h-10 text-amber-700" />}
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pos.</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="hidden md:table-cell text-right">Palpites Exatos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user, index) => (
                <TableRow key={user.id} className={cn(user.id === mockUser.id && "bg-blue-100/50 dark:bg-blue-900/20")}>
                  <TableCell className="font-medium w-16">{getMedal(index + 1)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${user.apelido.charAt(0)}`} alt={user.apelido} />
                        <AvatarFallback>{user.apelido.substring(0,2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.apelido}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-primary">{user.pontos}</TableCell>
                   <TableCell className="hidden md:table-cell text-right">{user.exatos}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
