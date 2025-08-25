
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
  MessageSquareWarning,
  FileClock,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    setOpenMobile(false);
  };

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuários', icon: Users },
    { href: '/admin/championships', label: 'Campeonatos', icon: Trophy },
    { href: '/admin/matches', label: 'Partidas', icon: CalendarCheck },
    { href: '/admin/logs', label: 'Logs de Atividades', icon: FileClock },
    { href: '/admin/emergency-message', label: 'Aviso Urgente', icon: MessageSquareWarning },
  ];
  
  const bottomMenuItems = [
      { href: '/admin/settings', label: 'Configurações', icon: Settings },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border bg-destructive/10 dark:bg-destructive/5">
      <SidebarHeader className="p-4 justify-center items-center">
         <Shield className="w-8 h-8 text-destructive group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6 transition-all" />
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
                <div>
                  <item.icon />
                  <span>{item.label}</span>
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
                    <SidebarMenuButton asChild tooltip={{ children: "Sair do Admin", side: 'right' }}>
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
