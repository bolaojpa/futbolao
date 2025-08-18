import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationsNav } from './notifications-nav';
import { UserNav } from './user-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 border-b">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <NotificationsNav />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
