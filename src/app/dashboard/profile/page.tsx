import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit } from 'lucide-react';
import { mockUser } from '@/lib/data';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { apelido, nome, email, fotoPerfil } = mockUser;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

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
      
      {/* As seções de estatísticas e últimos pontos foram removidas temporariamente para corrigir o erro de carregamento. */}
      
    </div>
  );
}
