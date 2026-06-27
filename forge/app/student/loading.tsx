import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Skeleton className="h-10 w-64 bg-zinc-800" />
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-56 bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
