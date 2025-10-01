'use client';

import { Suspense } from 'react';
import { LeaderboardPageClient } from '@/components/leaderboard/leaderboard-page-client';
import { Loader2 } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <LeaderboardPageClient />
    </Suspense>
  );
}
