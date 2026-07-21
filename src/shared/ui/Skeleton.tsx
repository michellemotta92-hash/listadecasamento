import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#e8e2dc]', className)}
      aria-hidden
    />
  );
}
