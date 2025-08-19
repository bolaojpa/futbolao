
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
import { mockUser, type UserType } from '@/lib/data';
import Link from 'next/link';
import { StatusIndicator } from './status-indicator';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function UserNav() {
  const { nome, email, apelido, fotoPerfil } = mockUser;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

  // Em um app real, isso seria gerenciado por um estado global (Context/Zustand)
  const [currentStatus, setCurrentStatus] = useState<UserType['presenceStatus']>(mockUser.presenceStatus);

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
          </Avatar>
          <div className="-bottom-0.5 -right-0.5 absolute">
            <StatusIndicator status={currentStatus} />
          </div>
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
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
               <Circle className={cn("mr-2 h-4 w-4 fill-current", statusConfig[currentStatus]?.color)} />
              <span>{currentStatus}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                 {statuses.map(status => (
                    <DropdownMenuItem key={status} onSelect={() => setCurrentStatus(status)}>
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
          <Link href="/dashboard/profile" passHref>
            <DropdownMenuItem asChild>
                <div>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </div>
            </DropdownMenuItem>
          </Link>
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
        <Link href="/login" passHref>
          <DropdownMenuItem asChild>
              <div>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </div>
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
