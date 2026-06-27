import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: student, error: studentError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (studentError || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const { data: skills, error: skillsError } = await supabaseAdmin
      .from('student_skills')
      .select('*, skills(*), skill_evidence(*)')
      .eq('student_id', id)
      .order('score', { ascending: false });

    if (skillsError) return NextResponse.json({ error: skillsError.message }, { status: 500 });

    return NextResponse.json({ student, skills: skills || [] });
  } catch (error) {
    console.error('GET skill passport error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
