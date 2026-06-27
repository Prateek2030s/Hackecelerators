'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppUser, Submission, Task } from '@/types';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/components/student/TaskCard';
import { cn } from '@/lib/utils';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type Role = 'founder' | 'student';

async function createBrowserSupabaseClient(): Promise<SupabaseClient> {
  const response = await fetch('/api/auth/config');
  const config = await response.json();
  if (!response.ok) throw new Error(config.error || 'Supabase auth config is missing.');
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

async function loadCurrentStudent(): Promise<AppUser | null> {
  const client = await createBrowserSupabaseClient();
  const { data } = await client.auth.getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser?.email) return null;

  const fallbackRole = sessionUser.user_metadata?.role as Role | undefined;
  if (fallbackRole && fallbackRole !== 'student') return null;

  const response = await fetch('/api/users?email=' + encodeURIComponent(sessionUser.email));
  const payload = await response.json();
  if (!response.ok) return null;
  const appUser = payload.users?.[0] as AppUser | undefined;
  return appUser?.role === 'student' ? appUser : null;
}

function average(values: number[]) {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0);
  if (clean.length === 0) return 0;
  return Math.round(clean.reduce((sum, value) => sum + value, 0) / clean.length);
}

export default function StudentPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [student, setStudent] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [error, setError] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [search, setSearch] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.set('difficulty', difficulty);
      const res = await fetch('/api/tasks?' + params.toString());
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load tasks');
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  const fetchStudentDashboard = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const currentStudent = await loadCurrentStudent();
      setStudent(currentStudent);
      if (!currentStudent) {
        setSubmissions([]);
        return;
      }

      const response = await fetch('/api/submissions?student_id=' + encodeURIComponent(currentStudent.id));
      const payload = await response.json();
      if (response.ok) setSubmissions(payload.submissions || []);
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStudentDashboard();
  }, [fetchStudentDashboard]);

  const filteredTasks = tasks.filter((task) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      task.description.toLowerCase().includes(q) ||
      (task.tech_skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const dashboard = useMemo(() => {
    const reviewed = submissions.filter((submission) => submission.overall_score > 0 || submission.scores);
    const approved = submissions.filter((submission) => submission.status === 'accepted');
    const codeQuality = average(reviewed.map((submission) => submission.scores?.codeQuality?.score || 0));
    const overall = average(reviewed.map((submission) => submission.overall_score || 0));
    const skills = new Map<string, { count: number; total: number }>();

    submissions.forEach((submission) => {
      submission.skills_assessed?.forEach((skill) => {
        const current = skills.get(skill.skill) || { count: 0, total: 0 };
        skills.set(skill.skill, { count: current.count + 1, total: current.total + skill.proficiency });
      });
    });

    const topSkills = Array.from(skills.entries())
      .map(([skill, value]) => ({ skill, count: value.count, score: Math.round(value.total / value.count) }))
      .sort((a, b) => b.count - a.count || b.score - a.score)
      .slice(0, 5);

    return {
      total: submissions.length,
      reviewed: reviewed.length,
      approved: approved.length,
      codeQuality,
      overall,
      topSkills,
    };
  }, [submissions]);

  const difficulties: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];
  const recentSubmissions = submissions.slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">Student Dashboard</p>
          <h1 className="font-heading text-3xl font-bold text-zinc-50">Tasks</h1>
        </div>
        {student && <p className="text-sm text-zinc-400">Signed in as {student.name}</p>}
      </div>

      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Submissions</p>
          <p className="mt-2 font-heading text-3xl font-bold text-zinc-50">{dashboard.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Approved</p>
          <p className="mt-2 font-heading text-3xl font-bold text-emerald-400">{dashboard.approved}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Code quality</p>
          <p className="mt-2 font-heading text-3xl font-bold text-amber-400">{dashboard.codeQuality || '-'}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-500">Average score</p>
          <p className="mt-2 font-heading text-3xl font-bold text-zinc-50">{dashboard.overall || '-'}</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading font-semibold text-zinc-50">Top skill signals</h2>
            {submissionsLoading && <span className="text-xs text-zinc-500">Loading...</span>}
          </div>
          {dashboard.topSkills.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {dashboard.topSkills.map((skill) => (
                <Badge key={skill.skill} variant="secondary">
                  {skill.skill}: {skill.score}%
                </Badge>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Submit a reviewed solution to start building skill metrics.</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-heading font-semibold text-zinc-50">Recent submissions</h2>
          {recentSubmissions.length > 0 ? (
            <div className="mt-3 space-y-2">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-950 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">{submission.task?.title || 'Submitted task'}</p>
                    <p className="text-xs text-zinc-500">{new Date(submission.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-700 capitalize">{submission.status === 'accepted' ? 'approved' : submission.status}</Badge>
                    <span className="font-heading text-lg font-bold text-zinc-50">{submission.overall_score || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Your submitted solutions will appear here.</p>
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {difficulties.map((d) => (
            <Button
              key={d}
              variant={difficulty === d ? 'default' : 'outline'}
              onClick={() => setDifficulty(d)}
              className={cn(
                'min-h-[44px] capitalize',
                difficulty === d
                  ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                  : 'border-zinc-700 text-zinc-300'
              )}
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
          <p className="text-zinc-400">No tasks available yet. Check back soon!</p>
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
