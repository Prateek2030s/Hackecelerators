import { NextRequest, NextResponse } from 'next/server';
import { upsertStudentSkillEvidence } from '@/lib/skill-passport';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { skills, submission_id, task_id } = body;

    if (!Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'skills array is required' }, { status: 400 });
    }

    const { data: student, error: studentError } = await supabaseAdmin
      .from('app_users')
      .select('*')
      .eq('id', id)
      .eq('role', 'student')
      .single();

    if (studentError || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    const updatedSkills = await upsertStudentSkillEvidence(
      id,
      skills.map((skill) => ({
        ...skill,
        submissionId: skill.submissionId || submission_id || null,
        taskId: skill.taskId || task_id || null,
      }))
    );

    return NextResponse.json({ skills: updatedSkills });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('POST skill evidence error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
