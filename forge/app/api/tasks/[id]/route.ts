import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .select('*, projects(*)')
      .eq('id', id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('task_id', id)
      .order('overall_score', { ascending: false });

    return NextResponse.json({
      task: {
        ...task,
        project: task.projects,
        submissions: submissions || [],
      },
    });
  } catch (error) {
    console.error('GET task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
