import type { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from '@/components/shared/DifficultyBadge';

interface TaskListItemProps {
  task: Task;
  onClick?: () => void;
  selected?: boolean;
}

export function TaskListItem({ task, onClick, selected }: TaskListItemProps) {
  return (
    <div
      className={`cursor-pointer rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-amber-500/50 bg-zinc-900'
          : 'border-zinc-800 bg-zinc-900 hover:border-amber-500/30'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-heading font-semibold text-zinc-50">{task.title}</h3>
        <DifficultyBadge difficulty={task.difficulty} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {(task.tech_skills || []).slice(0, 4).map((skill) => (
          <Badge key={skill} variant="outline" className="border-zinc-700 bg-zinc-800 text-xs">
            {skill}
          </Badge>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm text-zinc-500">
        <Badge variant="outline" className="border-zinc-700 capitalize">
          {task.status}
        </Badge>
        <span>{task.submission_count || 0} submissions</span>
        {(task.average_score ?? 0) > 0 && (
          <span>Avg score: {task.average_score}</span>
        )}
      </div>
    </div>
  );
}
