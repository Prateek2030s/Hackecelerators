import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (project) => {
        const { count: taskCount } = await supabaseAdmin
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);

        const { data: tasks } = await supabaseAdmin
          .from('tasks')
          .select('id')
          .eq('project_id', project.id);

        const taskIds = (tasks || []).map((t) => t.id);
        let submissionCount = 0;
        if (taskIds.length > 0) {
          const { count } = await supabaseAdmin
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .in('task_id', taskIds);
          submissionCount = count || 0;
        }

        return {
          ...project,
          task_count: taskCount || 0,
          submission_count: submissionCount,
        };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      founder_name,
      repo_url,
      repo_name,
      repo_description,
      repo_summary,
      tech_stack,
      architecture_overview,
    } = body;

    if (!founder_name || !repo_url || !repo_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        founder_name,
        repo_url,
        repo_name,
        repo_description: repo_description || null,
        repo_summary: repo_summary || {},
        tech_stack: tech_stack || [],
        architecture_overview: architecture_overview || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('POST projects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
