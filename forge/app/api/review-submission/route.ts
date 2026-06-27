import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import { CODE_REVIEW_PROMPT } from '@/lib/prompts';
import { fillPrompt, parseAIResponse } from '@/lib/utils';
import { upsertStudentSkillEvidence } from '@/lib/skill-passport';
import type { ReviewScores, SkillAssessment, Submission } from '@/types';

interface ReviewResponse {
  overallScore: number;
  scores: ReviewScores;
  overallFeedback: string;
  suggestedImprovements: string[];
  skillsAssessed: SkillAssessment[];
  passesThreshold: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { taskId, studentId, studentName, code, language, studentEmail } = await request.json();

    if (!taskId || !code || (!studentId && !studentName)) {
      return NextResponse.json({ error: 'taskId, code, and student identity are required' }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabaseAdmin.from('tasks').select('*').eq('id', taskId).single();
    if (taskError || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    let resolvedStudentName = studentName;
    let resolvedStudentEmail = studentEmail || null;

    if (studentId) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('app_users')
        .select('*')
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (studentError || !student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

      resolvedStudentName = resolvedStudentName || student.name;
      resolvedStudentEmail = resolvedStudentEmail || student.email;

      const { error: contributionError } = await supabaseAdmin
        .from('project_contributors')
        .upsert({ project_id: task.project_id, student_id: studentId, status: 'active' }, { onConflict: 'project_id,student_id' });

      if (contributionError) return NextResponse.json({ error: contributionError.message }, { status: 500 });
    }

    const prompt = fillPrompt(CODE_REVIEW_PROMPT, {
      taskTitle: task.title,
      taskDescription: task.description,
      businessContext: task.business_context || '',
      acceptanceCriteria: (task.acceptance_criteria || []).map((c: string) => '- ' + c).join('\n'),
      techSkills: (task.tech_skills || []).join(', '),
      language: language || 'javascript',
      code,
    });

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'AI review failed' }, { status: 500 });

    let review: ReviewResponse;
    try {
      review = parseAIResponse<ReviewResponse>(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const status = review.passesThreshold ? 'accepted' : 'reviewed';

    const { data: submission, error: insertError } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id: taskId,
        student_id: studentId || null,
        student_name: resolvedStudentName,
        student_email: resolvedStudentEmail,
        code,
        language: language || 'javascript',
        ai_review: { overallFeedback: review.overallFeedback, passesThreshold: review.passesThreshold },
        overall_score: review.overallScore,
        scores: review.scores,
        skills_assessed: review.skillsAssessed,
        feedback: review.overallFeedback,
        suggested_improvements: review.suggestedImprovements,
        status,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Submission insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    let passportSkills = [];
    if (studentId && review.skillsAssessed?.length) {
      passportSkills = await upsertStudentSkillEvidence(
        studentId,
        review.skillsAssessed.map((skill) => ({
          skill: skill.skill,
          proficiency: skill.proficiency,
          confidence: 75,
          evidence: skill.evidence,
          submissionId: submission.id,
          taskId,
        }))
      );
    }

    return NextResponse.json({ success: true, submission: submission as Submission, passportSkills });
  } catch (error) {
    console.error('review-submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
