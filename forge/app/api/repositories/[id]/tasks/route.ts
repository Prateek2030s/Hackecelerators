import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { RepositoryTaskListResponse } from '@/lib/contracts/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: repository, error: repositoryError } = await supabaseAdmin
      .from('projects')
      .select('id, repo_name, repo_url, repo_description, tech_stack')
      .eq('id', id)
      .single();

    if (repositoryError || !repository) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 });
    }

    const response: RepositoryTaskListResponse = {
      repository,
      tasks: tasks || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET repository tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
