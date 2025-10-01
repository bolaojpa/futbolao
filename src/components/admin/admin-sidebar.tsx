

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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [hasPendingUsers, setHasPendingUsers] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("status", "==", "pendente"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setHasPendingUsers(!querySnapshot.empty);
    });
    return () => unsubscribe();
  }, []);


  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users, hasNotification: hasPendingUsers },
    { href: '/admin/championships', label: 'Campeonatos', icon: Trophy },
    { href: '/admin/teams', label: 'Equipes', icon: Shield },
    { href: '/admin/matches', label: 'Partidas', icon: CalendarCheck },
    { href: '/admin/history', label: 'Histórico de Partidas', icon: History },
    { href: '/admin/ranking', label: 'Ranking', icon: BarChart3 },
    { href: '/admin/fame', label: 'Hall da Fama', icon: ShieldCheck },
    { href: '/admin/logs', label: 'Logs de Atividades', icon: FileClock },
    { href: '/admin/messaging', label: 'Mensagens', icon: Send },
  ];
  
  const bottomMenuItems = [
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
      { href: '/admin/support', label: 'Suporte', icon: LifeBuoy },
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
        {menuItems.map((item) => (
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
            {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref onClick={handleLinkClick}>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname.startsWith(item.href)}
                            tooltip={{ children: item.label, side: 'right' }}
                        >
                            <div>
                              <item.icon />
                              <span>{item.label}</span>
                            </div>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
                <Link href="/" passHref onClick={handleLinkClick}>
                    <SidebarMenuButton asChild tooltip={{ children: "Sair", side: 'right' }}>
                        <div>
                          <LogOut />
                          <span>Sair</span>
                        </div>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
