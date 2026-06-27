'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectCard } from '@/components/founder/ProjectCard';
import { CreateProjectDialog } from '@/components/founder/CreateProjectDialog';

export default function FounderPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load projects');
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl font-bold text-zinc-50">Your Projects</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="min-h-[44px] bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          <Plus className="mr-2 size-4" />
          Connect a Repository
        </Button>
      </div>

      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-zinc-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchProjects} variant="outline" className="mt-4 min-h-[44px]">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="text-6xl">📦</span>
          <h2 className="font-heading mt-4 text-xl font-semibold text-zinc-50">No projects yet</h2>
          <p className="mt-2 text-zinc-400">Connect your first GitHub repository to get started.</p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="mt-6 min-h-[44px] bg-amber-500 text-zinc-950 hover:bg-amber-400"
          >
            Connect a Repository
          </Button>
        </div>
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
