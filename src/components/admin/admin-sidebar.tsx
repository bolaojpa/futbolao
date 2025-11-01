
'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarCheck,
  Settings,
  LogOut,
  Shield,
  FileClock,
  History,
  ShieldCheck,
  Send,
  BarChart3,
  LifeBuoy,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth(); // Usando o hook de autenticação
  const [hasPendingUsers, setHasPendingUsers] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);

  useEffect(() => {
    // Listener for pending users
    const usersQuery = query(collection(db, "users"), where("status", "==", "pendente"));
    const unsubUsers = onSnapshot(usersQuery, (querySnapshot) => {
      setHasPendingUsers(!querySnapshot.empty);
    });

    // Listener for unread support messages
    const supportQuery = query(collection(db, "support_messages"), where("isReadByAdmin", "==", false));
    const unsubSupport = onSnapshot(supportQuery, (querySnapshot) => {
      setHasUnreadSupport(!querySnapshot.empty);
    });
    
    return () => {
      unsubUsers();
      unsubSupport();
    };
  }, []);


  const handleLinkClick = () => {
    setOpenMobile(false);
  };
  
  const handleLogout = async () => {
    setOpenMobile(false);
    await auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'moderator'] },
    { href: '/admin/users', label: 'Usuários', icon: Users, hasNotification: hasPendingUsers, roles: ['admin', 'moderator'] },
    { href: '/admin/championships', label: 'Campeonatos', icon: Trophy, roles: ['admin'] },
    { href: '/admin/teams', label: 'Equipes', icon: Shield, roles: ['admin'] },
    { href: '/admin/matches', label: 'Partidas', icon: CalendarCheck, roles: ['admin', 'moderator'] },
    { href: '/admin/history', label: 'Histórico de Partidas', icon: History, roles: ['admin', 'moderator'] },
    { href: '/admin/ranking', label: 'Ranking', icon: BarChart3, roles: ['admin', 'moderator'] },
    { href: '/admin/fame', label: 'Hall da Fama', icon: ShieldCheck, roles: ['admin', 'moderator'] },
    { href: '/admin/logs', label: 'Logs de Atividades', icon: FileClock, roles: ['admin'] },
    { href: '/admin/messaging', label: 'Mensagens', icon: Send, roles: ['admin'] },
  ];
  
  const bottomMenuItems = [
      { href: '/admin/settings', label: 'Configurações', icon: Settings, roles: ['admin'] },
      { href: '/admin/support', label: 'Suporte', icon: LifeBuoy, hasNotification: hasUnreadSupport, roles: ['admin', 'moderator'] },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 justify-center items-center">
         <Shield className="w-8 h-8 text-primary group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6 transition-all" />
        <span className="font-bold text-lg text-sidebar-foreground group-data-[state=collapsed]:hidden">
          Admin
        </span>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {menuItems.filter(item => user && item.roles.includes(user.funcao)).map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref onClick={handleLinkClick}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin')}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <div className="relative">
                  <item.icon />
                  <span>{item.label}</span>
                   {item.hasNotification && (
                    <span className={cn(
                      "absolute top-1 right-1 h-2 w-2 rounded-full bg-accent animate-pulse",
                      "group-data-[state=collapsed]:top-0"
                    )}>
                       <span className="sr-only">Novas notificações</span>
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter className="p-2">
         <SidebarMenu>
            {bottomMenuItems.filter(item => user && item.roles.includes(user.funcao)).map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref onClick={handleLinkClick}>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href)}
                            tooltip={{ children: item.label, side: 'right' }}
                        >
                            <div className="relative">
                              <item.icon />
                              <span>{item.label}</span>
                               {item.hasNotification && (
                                <Mail className={cn(
                                  "absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse",
                                  "group-data-[state=collapsed]:hidden"
                                )} />
                              )}
                            </div>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} asChild tooltip={{ children: "Sair", side: 'right' }}>
                    <div>
                      <LogOut />
                      <span>Sair</span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
