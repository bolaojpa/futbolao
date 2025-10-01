'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, LifeBuoy, Circle } from 'lucide-react';
import Link from 'next/link';
import { StatusIndicator } from './status-indicator';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import type { UserType } from '@/lib/types';
import { updateUserPresenceStatus } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function UserNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<UserType['presenceStatus']>('Disponível');

  useEffect(() => {
    if (user?.presenceStatus) {
      setCurrentStatus(user.presenceStatus);
    }
  }, [user]);

  if (loading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!user) {
    return null; // Ou um botão de Login
  }

  const { apelido, email, fotoPerfil } = user;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

  const handleStatusChange = async (newStatus: UserType['presenceStatus']) => {
    if (user) {
      setCurrentStatus(newStatus); // Optimistic update
      await updateUserPresenceStatus(user.id, newStatus);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };


  const statuses: UserType['presenceStatus'][] = ["Disponível", "Ausente", "Ocupado", "Não perturbe", "Offline"];
  
  const statusConfig = {
    'Disponível': { color: 'text-green-500', ringColor: 'ring-green-500/30' },
    'Ausente': { color: 'text-yellow-500', ringColor: 'ring-yellow-500/30' },
    'Ocupado': { color: 'text-red-500', ringColor: 'ring-red-500/30' },
    'Não perturbe': { color: 'text-purple-500', ringColor: 'ring-purple-500/30' },
    'Offline': { color: 'text-gray-500', ringColor: 'ring-gray-500/30' },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={fotoPerfil} alt={`@${apelido}`} />
            <AvatarFallback>{fallbackInitials}</AvatarFallback>
            <StatusIndicator status={currentStatus} className="w-3 h-3 top-0 right-0" />
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{apelido}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/profile" passHref>
            <DropdownMenuItem asChild>
                <div>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </div>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
               <Circle className={cn("mr-2 h-4 w-4 fill-current", statusConfig[currentStatus]?.color)} />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                 {statuses.map(status => (
                    <DropdownMenuItem key={status} onSelect={() => handleStatusChange(status)}>
                        <Circle className={cn("mr-2 h-4 w-4 fill-current", statusConfig[status]?.color)} />
                        <span>{status}</span>
                    </DropdownMenuItem>
                 ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/settings" passHref>
            <DropdownMenuItem asChild>
                <div>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </div>
            </DropdownMenuItem>
          </Link>
           <Link href="/dashboard/support" passHref>
              <DropdownMenuItem asChild>
                <div>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  <span>Suporte</span>
                </div>
              </DropdownMenuItem>
            </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}