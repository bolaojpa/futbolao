
import { Suspense } from 'react';
import { AdminMatchesPageClient } from '@/components/admin/matches-page-client';
import { Loader2 } from 'lucide-react';

export default function AdminMatchesPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminMatchesPageClient />
    </Suspense>
  );
}
