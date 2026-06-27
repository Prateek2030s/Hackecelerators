'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h2 className="font-heading text-2xl font-bold text-zinc-50">Failed to load dashboard</h2>
      <p className="mt-2 text-zinc-400">{error.message}</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset} variant="outline" className="min-h-[44px]">
          Retry
        </Button>
        <Button render={<Link href="/" />} className="min-h-[44px] bg-amber-500 text-zinc-950">
          Home
        </Button>
      </div>
    </div>
  );
}
