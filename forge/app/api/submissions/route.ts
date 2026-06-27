import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const studentName = searchParams.get('student_name');

    let query = supabaseAdmin
      .from('submissions')
      .select('*, tasks(id, title, project_id, projects(repo_name))')
      .order('overall_score', { ascending: false });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    if (studentName) {
      query = query.ilike('student_name', studentName);
    }

    const { data: submissions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (submissions || []).map((sub) => ({
      ...sub,
      task: sub.tasks
        ? {
            ...sub.tasks,
            project: sub.tasks.projects,
          }
        : undefined,
    }));

    return NextResponse.json({ submissions: formatted });
  } catch (error) {
    console.error('GET submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task_id, student_name, student_email, code, language } = body;

    if (!task_id || !student_name || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id,
        student_name,
        student_email: student_email || null,
        code,
        language: language || 'javascript',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ submission: data });
  } catch (error) {
    console.error('POST submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
