'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Task } from '@/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/student/TaskCard';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function StudentPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tasks');
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      (task.tech_skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const difficulties: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-16">
      <h1 className="font-heading text-3xl font-bold text-zinc-50">Engineering Tasks</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? 'default' : 'outline'}
              onClick={() => setDifficulty(d)}
              className={`min-h-[44px] capitalize ${
                difficulty === d
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : 'border-zinc-700 text-zinc-300'
              }`}
            >
              {d === 'all' ? 'All' : d}
            </Button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="min-h-[44px] border-zinc-700 bg-zinc-900 sm:max-w-xs"
        />
      </div>

      {loading && (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-zinc-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchTasks} variant="outline" className="mt-4 min-h-[44px]">
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && filteredTasks.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <span className="text-6xl">🔧</span>
          <p className="mt-4 text-zinc-400">No tasks available yet. Check back soon!</p>
        </div>
      )}

      {!loading && !error && filteredTasks.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
