
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Award, Gamepad2, Percent, Trophy, Star, Medal, Crown } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string | number, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
                {title}
            </CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
                {description}
            </p>
        </CardContent>
    </Card>
)

const renderHonorifics = (count: number) => {
    if (count === 0) return null;

    let icon: React.ComponentType<{ className?: string }> = Star;
    let displayCount = count;

    if (count >= 10) {
        icon = Crown;
        displayCount = count - 9;
    } else if (count >= 7) {
        icon = Trophy;
        displayCount = count - 6;
    } else if (count >= 4) {
        icon = Medal;
        displayCount = count - 3;
    }
    
    const IconComponent = icon;
    const icons = Array.from({ length: Math.min(displayCount, 3) }, (_, i) => (
        <IconComponent key={i} className="h-5 w-5 text-yellow-400" />
    ));

    return (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 h-6 bg-black/50 rounded-full px-2">
            {icons}
        </div>
    );
};

export default function ProfilePage() {
  const { apelido, nome, email, fotoPerfil, titulos, totalCampeonatos, totalJogos, taxaAcerto } = mockUser;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

  const stats = [
    { 
        icon: <Award className="h-4 w-4 text-muted-foreground" />,
        title: "Títulos",
        value: titulos,
        description: "Campeão da Pontuação Geral"
    },
    { 
        icon: <Gamepad2 className="h-4 w-4 text-muted-foreground" />,
        title: "Campeonatos Disputados",
        value: totalCampeonatos,
        description: "Total de competições participadas"
    },
    { 
        icon: <Edit className="h-4 w-4 text-muted-foreground" />,
        title: "Total de Palpites",
        value: totalJogos,
        description: "Palpites enviados em todos os tempos"
    },
    { 
        icon: <Percent className="h-4 w-4 text-muted-foreground" />,
        title: "Taxa de Acerto",
        value: `${taxaAcerto}%`,
        description: "Percentual de palpites premiados"
    },
];

  return (
    <div className="container mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex flex-col items-center gap-2">
             <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-primary">
                    <AvatarImage src={fotoPerfil} alt={`@${apelido}`} />
                    <AvatarFallback className="text-3xl">{fallbackInitials}</AvatarFallback>
                </Avatar>
                {renderHonorifics(titulos)}
            </div>
        </div>
        <div className='flex-1 text-center md:text-left'>
            <h1 className="text-3xl font-bold font-headline">{nome}</h1>
            <p className="text-muted-foreground text-lg">@{apelido}</p>
            <p className="text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Editar Perfil
        </Button>
      </div>

      <Separator />

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Minhas Estatísticas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map(stat => <StatCard key={stat.title} {...stat} />)}
        </div>
      </div>
    </div>
  );
}
