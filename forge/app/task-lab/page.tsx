'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BrainCircuit, GitBranch, Loader2, Sparkles } from 'lucide-react';
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

export default function TaskLabPage() {
  const [repoUrl, setRepoUrl] = useState('https://github.com/vercel/swr');
  const [result, setResult] = useState<TaskLabResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
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
              <h1 className="mt-2 font-heading text-3xl font-bold text-zinc-50 md:text-5xl">Generate simple repo tasks</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
                Paste a public GitHub repository URL. Forge reads tiny repo metadata and asks for only 3 small apprenticeship tasks.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <GitBranch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
                className="h-11 border-zinc-700 bg-zinc-900 pl-10 text-zinc-100"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="h-11 bg-amber-500 px-5 text-zinc-950 hover:bg-amber-400">
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate tasks
            </Button>
          </form>

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
                <Card key={`${task.title}-${index}`} className="border-zinc-800 bg-zinc-950/80">
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
                      {task.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                    <ul className="space-y-2 text-sm text-zinc-400">
                      {task.acceptanceCriteria.slice(0, 3).map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
