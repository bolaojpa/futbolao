
import { Suspense } from 'react';
import { HistoryPageClient } from '@/components/dashboard/history-page-client';
import { Loader2 } from 'lucide-react';

export default function HistoryPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <HistoryPageClient />
    </Suspense>
  );
}
