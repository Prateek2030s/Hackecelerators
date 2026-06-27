import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DifficultyBadgeProps {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

const styles = {
  beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('capitalize border', styles[difficulty], className)}
    >
      {difficulty}
    </Badge>
  );
}
