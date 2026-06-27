import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const [ownedProjects, contributions, submissions, skills] = await Promise.all([
      supabaseAdmin.from('projects').select('*').eq('founder_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('project_contributors').select('*, projects(*)').eq('student_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('submissions').select('*, tasks(id, title, project_id)').eq('student_id', id).order('created_at', { ascending: false }),
      supabaseAdmin.from('student_skills').select('*, skills(*)').eq('student_id', id).order('score', { ascending: false }),
    ]);

    return NextResponse.json({
      user,
      ownedProjects: ownedProjects.data || [],
      contributions: contributions.data || [],
      submissions: submissions.data || [],
      skills: skills.data || [],
    });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
