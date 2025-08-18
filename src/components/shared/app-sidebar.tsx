'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Trophy,
  CalendarCheck,
  History,
  Settings,
  LogOut,
  User,
  LifeBuoy,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/predictions', label: 'Palpites', icon: CalendarCheck },
    { href: '/dashboard/leaderboard', label: 'Ranking', icon: Trophy },
    { href: '/dashboard/history', label: 'Histórico', icon: History },
  ];
  
  const bottomMenuItems = [
      { href: '/dashboard/profile', label: 'Meu Perfil', icon: User },
      { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
      { href: '/dashboard/support', label: 'Suporte', icon: LifeBuoy },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 justify-center items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-8 h-8 text-primary group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6 transition-all"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 2a10 10 0 1 0-7.07 17.07" />
          <path d="m12 12-2 4 4 2 2-4-4-2z" />
        </svg>
        <span className="font-bold text-lg text-sidebar-foreground group-data-[state=collapsed]:hidden">
          FutBolão Pro
        </span>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
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
                    <Link href={item.href} passHref>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
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
                <Link href="/login" passHref>
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
