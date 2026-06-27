import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('submissions')
      .update({ status: 'accepted' })
      .eq('id', id)
      .select('*, app_users(*), tasks(id, title, project_id, projects(repo_name))')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Submission not found' }, { status: 404 });
    }

    const submission = {
      ...data,
      student: data.app_users || undefined,
      task: data.tasks ? { ...data.tasks, project: data.tasks.projects } : undefined,
    };

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Approve submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
