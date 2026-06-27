import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    const tasksWithStats = await Promise.all(
      (tasks || []).map(async (task) => {
        const { count: submissionCount } = await supabaseAdmin
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('task_id', task.id);

        const { data: submissions } = await supabaseAdmin
          .from('submissions')
          .select('overall_score')
          .eq('task_id', task.id);

        const scores = (submissions || []).map((s) => s.overall_score);
        const averageScore =
          scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        return {
          ...task,
          submission_count: submissionCount || 0,
          average_score: averageScore,
        };
      })
    );

    return NextResponse.json({
      project: { ...project, tasks: tasksWithStats },
    });
  } catch (error) {
    console.error('GET project error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
