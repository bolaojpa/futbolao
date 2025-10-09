
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
  Trophy,
  CalendarCheck,
  History,
  Settings,
  LogOut,
  User,
  LifeBuoy,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { onSnapshot, collection, query, where, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { SystemSettings } from '@/lib/types';
import Image from 'next/image';

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { user } = useAuth();
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const settingsRef = doc(db, 'system_settings', 'global');
    const unsubSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const settings = docSnap.data() as SystemSettings;
            setLogoUrl(settings.logoUrl);
        }
    });

    return () => unsubSettings();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "support_messages"),
      where("userId", "==", user.id),
      where("hasUnreadAdminReply", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnreadSupport(!snapshot.empty);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLinkClick = () => {
    setOpenMobile(false);
  };
  
  const handleLogout = async () => {
    setOpenMobile(false);
    await auth.signOut();
    router.push('/');
  }

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/predictions', label: 'Palpites', icon: CalendarCheck },
    { href: '/dashboard/leaderboard', label: 'Ranking', icon: Trophy },
    { href: '/dashboard/fame', label: 'Hall da Fama', icon: ShieldCheck },
    { href: '/dashboard/history', label: 'Histórico', icon: History },
  ];
  
  const bottomMenuItems = [
      { href: '/dashboard/profile', label: 'Meu Perfil', icon: User },
      { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
      { href: '/dashboard/support', label: 'Suporte', icon: LifeBuoy, notification: hasUnreadSupport },
  ]

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 justify-center items-center">
        {logoUrl ? (
             <Image src={logoUrl} alt="Logo" width={32} height={32} className="w-8 h-8 group-data-[state=collapsed]:w-6 group-data-[state=collapsed]:h-6 transition-all object-contain" unoptimized />
        ) : (
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
        )}
        <span className="font-bold text-lg text-sidebar-foreground group-data-[state=collapsed]:hidden">
          FutBolão Pro
        </span>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref onClick={handleLinkClick}>
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
                    <Link href={item.href} passHref onClick={handleLinkClick}>
                        <SidebarMenuButton
                            asChild
                            isActive={pathname === item.href}
                            tooltip={{ children: item.label, side: 'right' }}
                        >
                            <div className="relative">
                              <item.icon />
                              <span>{item.label}</span>
                              {item.notification && (
                                <Mail className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
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
