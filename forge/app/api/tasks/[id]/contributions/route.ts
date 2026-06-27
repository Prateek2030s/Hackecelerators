import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data: contributions, error } = await supabaseAdmin
      .from('project_contributors')
      .select('*, app_users(*)')
      .eq('project_id', task.project_id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ contributions: contributions || [] });
  } catch (error) {
    console.error('GET task contributions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { student_id, status = 'active' } = await request.json();

    if (!student_id) return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    if (!['active', 'completed', 'removed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid contribution status' }, { status: 400 });
    }

    const { data: student, error: studentError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('id', student_id)
      .eq('role', 'student')
      .single();

    if (studentError || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    const { data: contribution, error } = await supabaseAdmin
      .from('project_contributors')
      .upsert(
        {
          project_id: task.project_id,
          student_id,
          status,
        },
        { onConflict: 'project_id,student_id' }
      )
      .select('*, app_users(*)')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ contribution });
  } catch (error) {
    console.error('POST task contribution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
