import { supabaseAdmin } from '@/lib/supabase';

export type SkillEvidenceInput = {
  skill: string;
  score?: number;
  proficiency?: number;
  confidence?: number;
  evidence: string;
  submissionId?: string | null;
  taskId?: string | null;
};

function clampScore(value: unknown, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

export async function upsertStudentSkillEvidence(studentId: string, entries: SkillEvidenceInput[]) {
  const normalized = entries
    .map((entry) => ({
      skill: entry.skill?.trim(),
      score: clampScore(entry.score ?? entry.proficiency),
      confidence: clampScore(entry.confidence, 75),
      evidence: entry.evidence?.trim() || 'Evidence captured from a reviewed submission.',
      submissionId: entry.submissionId || null,
      taskId: entry.taskId || null,
    }))
    .filter((entry) => entry.skill);

  const updated = [];

  for (const entry of normalized) {
    const { data: skill, error: skillError } = await supabaseAdmin
      .from('skills')
      .upsert({ name: entry.skill }, { onConflict: 'name' })
      .select('*')
      .single();

    if (skillError || !skill) {
      throw new Error(skillError?.message || 'Failed to upsert skill');
    }

    const { data: current, error: currentError } = await supabaseAdmin
      .from('student_skills')
      .select('*')
      .eq('student_id', studentId)
      .eq('skill_id', skill.id)
      .maybeSingle();

    if (currentError) {
      throw new Error(currentError.message);
    }

    const assessmentCount = current?.assessment_count || 0;
    const nextCount = assessmentCount + 1;
    const nextScore = Math.round((((current?.score || 0) * assessmentCount) + entry.score) / nextCount);
    const nextConfidence = Math.round((((current?.confidence || 0) * assessmentCount) + entry.confidence) / nextCount);

    const { data: studentSkill, error: studentSkillError } = await supabaseAdmin
      .from('student_skills')
      .upsert(
        {
          student_id: studentId,
          skill_id: skill.id,
          score: nextScore,
          confidence: nextConfidence,
          evidence: entry.evidence,
          assessment_count: nextCount,
          last_assessed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,skill_id' }
      )
      .select('*, skills(*)')
      .single();

    if (studentSkillError || !studentSkill) {
      throw new Error(studentSkillError?.message || 'Failed to update student skill');
    }

    const { error: evidenceError } = await supabaseAdmin
      .from('skill_evidence')
      .insert({
        student_skill_id: studentSkill.id,
        submission_id: entry.submissionId,
        task_id: entry.taskId,
        score: entry.score,
        confidence: entry.confidence,
        evidence: entry.evidence,
      });

    if (evidenceError) {
      throw new Error(evidenceError.message);
    }

    updated.push(studentSkill);
  }

  return updated;
}
