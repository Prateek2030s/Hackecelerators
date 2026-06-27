'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, CheckCircle2, GitBranch, Loader2, Sparkles, UploadCloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type SimpleTask = {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate';
  estimatedTime: string;
  skills: string[];
  acceptanceCriteria: string[];
};

type TaskLabResult = {
  repo: {
    name: string;
    description: string;
    language: string;
    topics: string[];
  };
  tasks: SimpleTask[];
  source: 'openai' | 'fallback';
};

type CurrentUser = {
  id: string;
  name: string;
  role: 'founder' | 'student';
};

type UploadResult = {
  project: { id: string; repo_name: string };
  tasks: Array<{ id: string }>;
};

async function getCurrentUser(): Promise<CurrentUser | null> {
  const configResponse = await fetch('/api/auth/config');
  if (!configResponse.ok) return null;
  const config = await configResponse.json();
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  if (!sessionUser?.email) return null;

  const userResponse = await fetch('/api/users?email=' + encodeURIComponent(sessionUser.email));
  if (!userResponse.ok) return null;
  const payload = await userResponse.json();
  return payload.users?.[0] || null;
}

export default function TaskLabPage() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/vercel/swr');
  const [founderName, setFounderName] = useState('Demo Founder');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [result, setResult] = useState<TaskLabResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        if (user?.name) setFounderName(user.name);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setUploadResult(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/task-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Task generation failed.');
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Task generation failed.');
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmUpload() {
    if (!result) return;
    setError('');
    setIsUploading(true);

    try {
      if (currentUser && currentUser.role !== 'founder') {
        throw new Error('Sign in as a founder to upload reviewed tasks.');
      }

      const response = await fetch('/api/task-lab/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          repo: result.repo,
          tasks: result.tasks,
          founderId: currentUser?.role === 'founder' ? currentUser.id : null,
          founderName,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to upload tasks.');
      setUploadResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload tasks.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground md:px-8 lg:px-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <Button render={<Link href="/" />} variant="ghost" className="w-fit text-zinc-400 hover:text-zinc-50">
          <ArrowLeft className="size-4" />
          Back
        </Button>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl shadow-black/30 md:p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400">
              <BrainCircuit className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-amber-400">Forge Task Lab</p>
              <h1 className="mt-2 font-heading text-3xl font-bold text-zinc-50 md:text-5xl">Review and upload repo tasks</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                Paste a public GitHub repository URL, review the generated tasks, then upload the approved set for students.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <GitBranch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/owner/repo" className="h-11 border-zinc-700 bg-zinc-900 pl-10 text-zinc-100" />
            </div>
            <Input value={founderName} onChange={(event) => setFounderName(event.target.value)} placeholder="Founder name" className="h-11 border-zinc-700 bg-zinc-900 text-zinc-100" disabled={Boolean(currentUser?.name)} />
            <Button type="submit" disabled={isLoading} className="h-11 bg-amber-500 px-5 text-zinc-950 hover:bg-amber-400">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate preview
            </Button>
          </form>

          {currentUser ? (
            <p className="mt-3 text-xs text-zinc-500">Signed in as {currentUser.name} ({currentUser.role}).</p>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">Not signed in. This demo can still upload tasks under the founder name above.</p>
          )}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        </section>

        {result ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-2xl font-semibold text-zinc-50">{result.repo.name}</h2>
                <p className="mt-1 text-sm text-zinc-400">{result.repo.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{result.repo.language}</Badge>
                <Badge variant="outline">{result.source === 'openai' ? 'OpenAI' : 'Demo fallback'}</Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {result.tasks.map((task, index) => (
                <Card key={task.title + '-' + index} className="border-zinc-800 bg-zinc-950/80">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge className="bg-amber-500/10 text-amber-300">Task {index + 1}</Badge>
                      <span className="text-xs text-zinc-500">{task.estimatedTime}</span>
                    </div>
                    <CardTitle className="text-zinc-50">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">{task.difficulty}</Badge>
                      {task.skills.slice(0, 3).map((skill) => (<Badge key={skill} variant="secondary">{skill}</Badge>))}
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      {task.acceptanceCriteria.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" /><span>{item}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-zinc-50">Founder review</h3>
                <p className="mt-1 text-sm text-zinc-400">Confirming uploads this reviewed task set to the student task marketplace.</p>
              </div>
              <Button onClick={confirmUpload} disabled={isUploading || Boolean(uploadResult)} className="h-11 bg-amber-500 px-5 text-zinc-950 hover:bg-amber-400">
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : uploadResult ? <CheckCircle2 className="size-4" /> : <UploadCloud className="size-4" />}
                {uploadResult ? 'Uploaded' : 'Confirm & upload tasks'}
              </Button>
            </div>

            {uploadResult ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Uploaded {uploadResult.tasks.length} tasks to {uploadResult.project.repo_name}.{' '}
                <Link href={'/founder/project/' + uploadResult.project.id} className="font-medium underline underline-offset-4">Review project</Link>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
