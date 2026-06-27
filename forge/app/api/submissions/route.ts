import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const studentId = searchParams.get('student_id');
    const studentName = searchParams.get('student_name');

    let query = supabaseAdmin
      .from('submissions')
      .select('*, app_users(*), tasks(id, title, project_id, projects(repo_name))')
      .order('overall_score', { ascending: false });

    if (taskId) query = query.eq('task_id', taskId);
    if (studentId) query = query.eq('student_id', studentId);
    if (studentName) query = query.ilike('student_name', studentName);

    const { data: submissions, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const formatted = (submissions || []).map((sub) => ({
      ...sub,
      student: sub.app_users || undefined,
      task: sub.tasks ? { ...sub.tasks, project: sub.tasks.projects } : undefined,
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
    const { task_id, student_id, student_name, student_email, code, language } = body;

    if (!task_id || !code || (!student_id && !student_name)) {
      return NextResponse.json({ error: 'task_id, code, and student identity are required' }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('id, project_id')
      .eq('id', task_id)
      .single();

    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    let resolvedStudentName = student_name;
    let resolvedStudentEmail = student_email || null;

    if (student_id) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('id', student_id)
        .eq('role', 'student')
        .single();

      if (studentError || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      resolvedStudentName = resolvedStudentName || student.name;
      resolvedStudentEmail = resolvedStudentEmail || student.email;

      const { error: contributionError } = await supabaseAdmin
        .from('project_contributors')
        .upsert({ project_id: task.project_id, student_id, status: 'active' }, { onConflict: 'project_id,student_id' });

      if (contributionError) return NextResponse.json({ error: contributionError.message }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id,
        student_id: student_id || null,
        student_name: resolvedStudentName,
        student_email: resolvedStudentEmail,
        code,
        language: language || 'javascript',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ submission: data });
  } catch (error) {
    console.error('POST submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
