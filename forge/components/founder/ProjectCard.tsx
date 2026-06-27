'use client';

import { useRouter } from 'next/navigation';
import type { Project } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer rounded-xl border-zinc-800 bg-zinc-900 transition-all hover:border-amber-500/30 hover:-translate-y-0.5"
      onClick={() => router.push(`/founder/project/${project.id}`)}
    >
      <CardHeader>
        <CardTitle className="font-heading text-lg text-zinc-50">{project.repo_name}</CardTitle>
        <p className="truncate text-sm text-zinc-400">
          {project.repo_description || 'No description'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5">
          {(project.tech_stack || []).slice(0, 5).map((tech) => (
            <Badge
              key={tech}
              variant="outline"
              className="border-zinc-700 bg-zinc-800 text-zinc-300"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-zinc-500">
        <span>{project.task_count || 0} tasks</span>
        <span className="mx-2">·</span>
        <span>{project.submission_count || 0} submissions</span>
      </CardFooter>
    </Card>
  );
}
