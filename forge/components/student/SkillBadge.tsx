import { Badge } from '@/components/ui/badge';
import { getScoreColor } from '@/lib/utils';

interface SkillBadgeProps {
  skill: string;
  proficiency: number;
}

export function SkillBadge({ skill, proficiency }: SkillBadgeProps) {
  return (
    <Badge variant="outline" className="border-zinc-700 bg-zinc-800 px-3 py-1.5">
      <span className="text-zinc-300">{skill}</span>
      <span className={`ml-2 font-heading font-bold ${getScoreColor(proficiency)}`}>
        {proficiency}%
      </span>
    </Badge>
  );
}
