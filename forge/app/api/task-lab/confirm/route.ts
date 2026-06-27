import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

type ReviewedTask = {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  skills?: string[];
  acceptanceCriteria?: string[];
};

function isReviewedTask(task: unknown): task is ReviewedTask {
  const candidate = task as Partial<ReviewedTask>;
  return Boolean(candidate?.title && candidate?.description);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, repo, tasks, founderId, founderName } = body;

    if (!repoUrl || !repo?.name || !Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'repoUrl, repo, and reviewed tasks are required.' }, { status: 400 });
    }

    const reviewedTasks = tasks.filter(isReviewedTask).slice(0, 10);
    if (reviewedTasks.length === 0) {
      return NextResponse.json({ error: 'No valid tasks to upload.' }, { status: 400 });
    }

    let resolvedFounderName = founderName || 'Demo Founder';

    if (founderId) {
      const { data: founder, error: founderError } = await supabaseAdmin
        .from('app_users')
        .select('id, name, role')
        .eq('id', founderId)
        .eq('role', 'founder')
        .single();

      if (founderError || !founder) {
        return NextResponse.json({ error: 'Founder account not found.' }, { status: 404 });
      }

      resolvedFounderName = founder.name;
    }

    const techStack = [repo.language, ...(repo.topics || [])]
      .filter(Boolean)
      .filter((value, index, all) => all.indexOf(value) === index);

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert({
        founder_id: founderId || null,
        founder_name: resolvedFounderName,
        repo_url: repoUrl,
        repo_name: repo.name,
        repo_description: repo.description || null,
        repo_summary: {
          summary: repo.description || repo.name,
          techStack,
          architecture: 'Generated from a lightweight repository preview in Forge Task Lab.',
          businessContext: 'Founder-reviewed apprenticeship tasks generated from public repository context.',
          keyModules: [],
        },
        tech_stack: techStack,
        architecture_overview: 'Generated from a lightweight repository preview in Forge Task Lab.',
      })
      .select('*')
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: projectError?.message || 'Failed to create project.' }, { status: 500 });
    }

    const rows = reviewedTasks.map((task) => ({
      project_id: project.id,
      title: task.title,
      description: task.description,
      business_context: 'Founder approved task generated from repository context.',
      architecture_context: 'Use the existing repository patterns and keep the change small enough for an apprenticeship task.',
      relevant_files: [],
      acceptance_criteria: task.acceptanceCriteria || [],
      difficulty: task.difficulty || 'beginner',
      tech_skills: task.skills || [],
      estimated_time: task.estimatedTime || null,
      status: 'open',
    }));

    const { data: insertedTasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert(rows)
      .select('*');

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    return NextResponse.json({ project, tasks: insertedTasks || [] });
  } catch (error) {
    console.error('POST task-lab confirm error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
