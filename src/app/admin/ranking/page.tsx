'use client';

import { Suspense } from 'react';
import { AdminRankingPageClient } from '@/components/admin/ranking-page-client';
import { Loader2 } from 'lucide-react';

export default function AdminRankingPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AdminRankingPageClient />
    </Suspense>
  );
}
