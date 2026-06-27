import Link from 'next/link';
import type { Task } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from '@/components/shared/DifficultyBadge';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const skills = task.tech_skills || [];
  const visibleSkills = skills.slice(0, 4);
  const overflow = skills.length - 4;

  return (
    <Card className="flex flex-col rounded-xl border-zinc-800 bg-zinc-900 transition-colors hover:border-amber-500/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-heading text-lg text-zinc-50">{task.title}</CardTitle>
          <DifficultyBadge difficulty={task.difficulty} />
        </div>
        <p className="text-sm text-zinc-500">
          from {task.project?.repo_name || 'Unknown project'}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <Badge key={skill} variant="outline" className="border-zinc-700 bg-zinc-800 text-xs">
              {skill}
            </Badge>
          ))}
          {overflow > 0 && (
            <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-xs">
              +{overflow} more
            </Badge>
          )}
        </div>
        <p className="line-clamp-2 text-sm text-zinc-400">{task.description}</p>
        {task.estimated_time && (
          <p className="text-xs text-zinc-500">⏱ {task.estimated_time}</p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          render={<Link href={`/student/task/${task.id}`} />}
          variant="outline"
          className="min-h-[44px] w-full border-zinc-700 hover:border-amber-500"
        >
          Start Task →
        </Button>
      </CardFooter>
    </Card>
  );
}
