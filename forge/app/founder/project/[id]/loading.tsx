import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Skeleton className="h-8 w-32 bg-zinc-800" />
      <Skeleton className="mt-4 h-10 w-2/3 bg-zinc-800" />
      <Skeleton className="mt-8 h-64 w-full bg-zinc-800" />
    </div>
  );
}
