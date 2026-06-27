import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import type { GenerateRepositoryTasksResponse } from '@/lib/contracts/api';
import type { RepoSummary, Task } from '@/types';

type GeneratedTask = {
  title: string;
  description: string;
  businessContext?: string;
  architectureContext?: string;
  relevantFiles?: string[];
  acceptanceCriteria?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  techSkills?: string[];
  estimatedTime?: string;
};

function clampTaskCount(count: unknown) {
  if (typeof count !== 'number' || Number.isNaN(count)) return 3;
  return Math.min(Math.max(Math.floor(count), 1), 5);
}

function parseJsonObject<T>(content: string): T {
  const trimmed = content.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  const json = start >= 0 && end >= start ? trimmed.slice(start, end + 1) : trimmed;
  return JSON.parse(json) as T;
}

function fallbackTasks(repository: { repo_name: string; repo_description: string | null; tech_stack: string[] | null }): GeneratedTask[] {
  const stack = repository.tech_stack?.[0] || 'the main stack';

  return [
    {
      title: 'Improve the README quickstart',
      description: 'Make the repository easier for a new contributor to run locally with setup, run, and troubleshooting notes.',
      businessContext: 'Faster onboarding helps founders evaluate students on real implementation work instead of environment setup.',
      architectureContext: 'Touches documentation only and should not change runtime behavior.',
      relevantFiles: ['README.md'],
      acceptanceCriteria: ['Install steps are documented', 'Run steps are documented', 'At least two common setup issues are covered'],
      difficulty: 'beginner',
      techSkills: ['Documentation', 'Developer Experience'],
      estimatedTime: '30-45 min',
    },
    {
      title: 'Add a simple empty state',
      description: 'Find a list, dashboard, or result view and add a helpful empty state when there is no data to display.',
      businessContext: 'Empty states reduce user confusion and make the product feel more polished during early usage.',
      architectureContext: 'Follow the existing UI component pattern and keep the state local to the relevant view.',
      relevantFiles: [],
      acceptanceCriteria: ['Empty data renders a clear message', 'Normal populated data still renders correctly', 'The UI remains responsive on mobile'],
      difficulty: 'beginner',
      techSkills: [stack, 'Frontend'],
      estimatedTime: '1 hour',
    },
    {
      title: 'Add one smoke test for the main flow',
      description: 'Create a lightweight test that checks the primary page, command, or API path still works.',
      businessContext: 'A smoke test gives startups confidence that future student changes do not break the core demo path.',
      architectureContext: 'Use the test style already present in the repository, or add the smallest conventional test setup.',
      relevantFiles: [],
      acceptanceCriteria: ['The test covers one happy path', 'The test runs with the documented command', 'Failure output is understandable'],
      difficulty: 'intermediate',
      techSkills: ['Testing', stack],
      estimatedTime: '1-2 hours',
    },
  ];
}

function buildPrompt(repository: {
  repo_name: string;
  repo_description: string | null;
  repo_summary: RepoSummary | Record<string, unknown> | null;
  tech_stack: string[] | null;
  architecture_overview: string | null;
}, count: number) {
  const summary = repository.repo_summary as Partial<RepoSummary> | null;
  return [
    'Generate exactly ' + count + ' simple engineering apprenticeship tasks for this repository.',
    'Keep tasks small, beginner-friendly, and practical. Avoid long explanations.',
    '',
    'Repository: ' + repository.repo_name,
    'Description: ' + (repository.repo_description || summary?.summary || 'No description'),
    'Tech stack: ' + ((repository.tech_stack || summary?.techStack || []).join(', ') || 'Unknown'),
    'Architecture: ' + (repository.architecture_overview || summary?.architecture || 'Unknown'),
    '',
    'Return JSON only with this shape:',
    '{"tasks":[{"title":"","description":"","businessContext":"","architectureContext":"","relevantFiles":[""],"acceptanceCriteria":[""],"difficulty":"beginner|intermediate","techSkills":[""],"estimatedTime":""}]}',
  ].join('\n');
}

function toInsertRows(projectId: string, tasks: GeneratedTask[]) {
  return tasks.map((task) => ({
    project_id: projectId,
    title: task.title,
    description: task.description,
    business_context: task.businessContext || null,
    architecture_context: task.architectureContext || null,
    relevant_files: task.relevantFiles || [],
    acceptance_criteria: task.acceptanceCriteria || [],
    difficulty: task.difficulty || 'beginner',
    tech_skills: task.techSkills || [],
    estimated_time: task.estimatedTime || null,
    status: 'open',
  }));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const count = clampTaskCount(body.count);
    const forceRegenerate = body.forceRegenerate === true;

    const { data: repository, error: repositoryError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (repositoryError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { data: existingTasks, error: existingError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if ((existingTasks || []).length > 0 && !forceRegenerate) {
      const response: GenerateRepositoryTasksResponse = {
        repositoryId: id,
        tasks: existingTasks as Task[],
        source: 'existing',
        generated: false,
      };
      return NextResponse.json(response);
    }

    if (forceRegenerate && (existingTasks || []).length > 0) {
      const { error: deleteError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('project_id', id);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }
    }

    let generatedTasks: GeneratedTask[];
    let source: 'openai' | 'fallback' = 'fallback';

    if (process.env.OPENAI_API_KEY) {
      const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: buildPrompt(repository, count) }],
        temperature: 0.25,
        max_tokens: 900,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      const parsed = content ? parseJsonObject<{ tasks?: GeneratedTask[] }>(content) : {};
      generatedTasks = Array.isArray(parsed.tasks) && parsed.tasks.length > 0
        ? parsed.tasks.slice(0, count)
        : fallbackTasks(repository).slice(0, count);
      source = Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? 'openai' : 'fallback';
    } else {
      generatedTasks = fallbackTasks(repository).slice(0, count);
    }

    const { data: insertedTasks, error: insertError } = await supabaseAdmin
      .from('tasks')
      .insert(toInsertRows(id, generatedTasks))
      .select('*');

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const response: GenerateRepositoryTasksResponse = {
      repositoryId: id,
      tasks: (insertedTasks || []) as Task[],
      source,
      generated: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('POST generate repository tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
