'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Check } from 'lucide-react';
import type { AppUser, Submission, Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { DifficultyBadge } from '@/components/shared/DifficultyBadge';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { CodeWorkspace, CodeWorkspaceMobileTabs } from '@/components/student/CodeWorkspace';
import { ReviewResult } from '@/components/student/ReviewResult';
import { detectLanguageFromTechStack } from '@/lib/utils';

type Role = 'founder' | 'student';

const REVIEW_MESSAGES = [
  'Submitting your code...',
  'AI is reading your implementation...',
  'Evaluating correctness...',
  'Checking code quality...',
  'Assessing security practices...',
  'Calculating your score...',
];

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

function TaskInfoPanel({ task }: { task: Task }) {
  return (
    <div className="h-full space-y-6 overflow-y-auto pr-2">
      <div>
        <h1 className="font-heading text-2xl font-bold text-zinc-50">{task.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <DifficultyBadge difficulty={task.difficulty} />
          {task.estimated_time && (
            <span className="text-sm text-zinc-500">⏱ {task.estimated_time}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          From: {task.project?.repo_name || 'Unknown project'}
        </p>
      </div>

      {task.business_context && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-zinc-50">Business Context</h2>
          <p className="mt-2 text-sm text-zinc-400">{task.business_context}</p>
        </section>
      )}

      {task.architecture_context && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-zinc-50">Architecture Context</h2>
          <p className="mt-2 text-sm text-zinc-400">{task.architecture_context}</p>
        </section>
      )}

      {(task.relevant_files?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-zinc-50">Relevant Files</h2>
          <ul className="mt-2 space-y-1">
            {task.relevant_files.map((file) => (
              <li key={file} className="rounded bg-zinc-950 px-3 py-1.5 font-mono text-xs text-amber-400/80">
                {file}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(task.acceptance_criteria?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-zinc-50">Acceptance Criteria</h2>
          <ul className="mt-2 space-y-2">
            {task.acceptance_criteria.map((criterion, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                {criterion}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(task.tech_skills?.length ?? 0) > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-zinc-50">Skills You&apos;ll Practice</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.tech_skills.map((skill) => (
              <Badge key={skill} variant="outline" className="border-zinc-700 bg-zinc-800">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function TaskWorkspacePage() {
  const params = useParams();
  const id = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentName, setStudentName] = useState('');
  const [student, setStudent] = useState<AppUser | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitError, setSubmitError] = useState('');

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Task not found');
      setTask(data.task);
      const defaultLang = detectLanguageFromTechStack(data.task.project?.tech_stack || []);
      setLanguage(defaultLang);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  useEffect(() => {
    let active = true;

    loadCurrentStudent()
      .then((currentStudent) => {
        if (!active || !currentStudent) return;
        setStudent(currentStudent);
        setStudentName((current) => current || currentStudent.name);
      })
      .catch(() => {
        if (active) setStudent(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const resolvedStudentName = studentName.trim() || 'Demo Student';

    if (!code.trim()) {
      setSubmitError('Please write some code before submitting');
      return;
    }

    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: id,
          studentId: student?.id,
          studentName: resolvedStudentName,
          code,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      setSubmission(data.submission);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-32 bg-zinc-800" />
        <Skeleton className="mt-4 h-12 w-2/3 bg-zinc-800" />
        <Skeleton className="mt-8 h-96 w-full bg-zinc-800" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center md:px-8">
        <p className="text-red-500">{error || 'Task not found'}</p>
        <Button render={<Link href="/student" />} variant="outline" className="mt-4 min-h-[44px]">
          Back to Tasks
        </Button>
      </div>
    );
  }

  const taskPanel = (
    <>
      <Link
        href="/student"
        className="mb-4 inline-flex min-h-[44px] items-center gap-2 text-sm text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="size-4" />
        Back to Tasks
      </Link>
      <TaskInfoPanel task={task} />
    </>
  );

  const codePanel = (
    <CodeWorkspace
      taskTitle={task.title}
      defaultLanguage={language}
      studentName={studentName}
      onStudentNameChange={setStudentName}
      code={code}
      onCodeChange={setCode}
      language={language}
      onLanguageChange={setLanguage}
      onSubmit={handleSubmit}
      submitting={submitting}
    />
  );

  return (
    <>
      <LoadingOverlay messages={REVIEW_MESSAGES} isVisible={submitting} />

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 lg:px-16">
        <div className="hidden md:flex md:h-[calc(100vh-12rem)] md:min-h-[520px] md:max-h-[760px] md:gap-6">
          <div className="min-h-0 w-[45%] shrink-0 overflow-hidden">{taskPanel}</div>
          <div className="min-h-0 w-[55%] flex-1 overflow-hidden">
            {!submission ? (
              <>
                {codePanel}
                {submitError && (
                  <p className="mt-2 text-sm text-red-500">{submitError}</p>
                )}
              </>
            ) : (
              <ReviewResult submission={submission} />
            )}
          </div>
        </div>

        <div className="md:hidden">
          {!submission ? (
            <>
              <CodeWorkspaceMobileTabs taskPanel={taskPanel} codePanel={codePanel} />
              {submitError && (
                <p className="mt-2 text-sm text-red-500">{submitError}</p>
              )}
            </>
          ) : (
            <>
              {taskPanel}
              <ReviewResult submission={submission} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
