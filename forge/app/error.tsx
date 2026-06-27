'use client';

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
      <h2 className="font-heading text-2xl font-bold text-zinc-50">Something went wrong</h2>
      <p className="mt-2 text-zinc-400">{error.message || 'An unexpected error occurred.'}</p>
      <Button onClick={reset} className="mt-6 min-h-[44px] bg-amber-500 text-zinc-950 hover:bg-amber-400">
        Try again
      </Button>
    </div>
  );
}
