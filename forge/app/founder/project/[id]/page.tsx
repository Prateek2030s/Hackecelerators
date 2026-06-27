'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Project, Submission, Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TaskListItem } from '@/components/founder/TaskListItem';
import { SubmissionListItem } from '@/components/founder/SubmissionListItem';

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [archExpanded, setArchExpanded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectRes, submissionsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch('/api/submissions?project_id=' + encodeURIComponent(id)),
      ]);

      const projectData = await projectRes.json();
      const submissionsData = await submissionsRes.json();

      if (!projectRes.ok) throw new Error(projectData.error || 'Project not found');

      setProject(projectData.project);

      const taskIds = (projectData.project.tasks || []).map((t: Task) => t.id);
      const filtered = (submissionsData.submissions || []).filter((s: Submission) =>
        taskIds.includes(s.task_id)
      );
      setSubmissions(filtered.sort((a: Submission, b: Submission) => b.overall_score - a.overall_score));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReviewUpdated = (updatedSubmission: Submission) => {
    setSubmissions((current) =>
      current
        .map((submission) =>
          submission.id === updatedSubmission.id
            ? { ...submission, ...updatedSubmission, task: submission.task || updatedSubmission.task }
            : submission
        )
        .sort((a, b) => b.overall_score - a.overall_score)
    );
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <Skeleton className="h-8 w-48 bg-zinc-800" />
        <Skeleton className="mt-4 h-24 w-full bg-zinc-800" />
        <Skeleton className="mt-8 h-64 w-full bg-zinc-800" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8">
        <p className="text-red-500">{error || 'Project not found'}</p>
        <Button render={<Link href="/founder" />} variant="outline" className="mt-4 min-h-[44px]">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const summary = project.repo_summary?.summary || project.repo_description;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-16">
      <Link
        href="/founder"
        className="inline-flex min-h-[44px] items-center gap-2 text-sm text-zinc-400 hover:text-amber-500"
      >
        <ArrowLeft className="size-4" />
        Back to Projects
      </Link>

      <h1 className="font-heading mt-4 text-3xl font-bold text-zinc-50">{project.repo_name}</h1>
      {summary && <p className="mt-2 text-zinc-400">{summary}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {(project.tech_stack || []).map((tech) => (
          <Badge key={tech} variant="outline" className="border-zinc-700 bg-zinc-800">
            {tech}
          </Badge>
        ))}
      </div>

      {project.architecture_overview && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900">
          <button
            type="button"
            onClick={() => setArchExpanded(!archExpanded)}
            className="flex min-h-[44px] w-full items-center justify-between p-4 text-left"
          >
            <span className="font-heading font-semibold text-zinc-50">Architecture Overview</span>
            {archExpanded ? (
              <ChevronUp className="size-4 text-zinc-500" />
            ) : (
              <ChevronDown className="size-4 text-zinc-500" />
            )}
          </button>
          {archExpanded && (
            <p className="border-t border-zinc-800 p-4 text-sm text-zinc-400">
              {project.architecture_overview}
            </p>
          )}
        </div>
      )}

      <Tabs defaultValue="tasks" className="mt-8">
        <TabsList className="border border-zinc-800 bg-zinc-900">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          {(project.tasks || []).map((task) => (
            <div key={task.id}>
              <TaskListItem
                task={task}
                selected={selectedTask?.id === task.id}
                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
              />
              {selectedTask?.id === task.id && (
                <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                  <p>{task.description}</p>
                  {task.business_context && (
                    <div className="mt-4">
                      <h4 className="font-heading font-semibold text-zinc-300">Business Context</h4>
                      <p className="mt-1">{task.business_context}</p>
                    </div>
                  )}
                  {task.acceptance_criteria?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-heading font-semibold text-zinc-300">Acceptance Criteria</h4>
                      <ul className="mt-1 list-disc pl-5">
                        {task.acceptance_criteria.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {(project.tasks || []).length === 0 && (
            <p className="text-center text-zinc-500">No tasks generated yet.</p>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-6 space-y-4">
          {submissions.map((submission) => {
            const task = project.tasks?.find((t) => t.id === submission.task_id);
            return (
              <SubmissionListItem
                key={submission.id}
                submission={{ ...submission, task }}
                              onReviewUpdated={handleReviewUpdated}
              />
            );
          })}
          {submissions.length === 0 && (
            <p className="text-center text-zinc-500">No submissions yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
