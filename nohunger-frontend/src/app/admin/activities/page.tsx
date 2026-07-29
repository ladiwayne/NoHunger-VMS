'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function AdminActivitiesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/events');
  }, [router]);

  return (
    <AppLayout activePath="/admin/events">
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-card">
        <h1 className="text-2xl font-700 text-foreground">Redirecting to admin events</h1>
        <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
          Activity management has been consolidated into the admin events experience.
        </p>
        <Link
          href="/admin/events"
          className="mt-5 inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-[14px] font-700 text-white transition hover:bg-primary/90"
        >
          Open admin events
        </Link>
      </div>
    </AppLayout>
  );
}
