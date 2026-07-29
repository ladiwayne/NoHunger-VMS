'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function ActivitiesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/events');
  }, [router]);

  return (
    <AppLayout activePath="/events">
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-card">
        <h1 className="text-2xl font-700 text-foreground">Redirecting to events</h1>
        <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
          The activities experience has been folded into the main event flow. You will be taken to the events page shortly.
        </p>
        <Link
          href="/events"
          className="mt-5 inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-[14px] font-700 text-white transition hover:bg-primary/90"
        >
          Go to events now
        </Link>
      </div>
    </AppLayout>
  );
}
