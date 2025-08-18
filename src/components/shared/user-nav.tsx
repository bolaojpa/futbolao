'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, LifeBuoy } from 'lucide-react';
import { mockUser } from '@/lib/data';
import Link from 'next/link';

export function UserNav() {
  const { nome, email, apelido, fotoPerfil } = mockUser;
  const fallbackInitials = apelido.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={fotoPerfil} alt={`@${apelido}`} />
            <AvatarFallback>{fallbackInitials}</AvatarFallback>
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
          <Link href="/dashboard/settings" passHref>
            <DropdownMenuItem asChild>
                <div>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </div>
            </DropdownMenuItem>
          </Link>
           <DropdownMenuItem>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Suporte</span>
          </DropdownMenuItem>
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
