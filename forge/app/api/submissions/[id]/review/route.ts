import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, getOpenAIKey } from '@/lib/openai';
import { CODE_REVIEW_PROMPT } from '@/lib/prompts';
import { upsertStudentSkillEvidence } from '@/lib/skill-passport';
import { supabaseAdmin } from '@/lib/supabase';
import { fillPrompt, parseAIResponse } from '@/lib/utils';
import type { ReviewScores, SkillAssessment, Submission } from '@/types';

interface ReviewResponse {
  overallScore: number;
  scores: ReviewScores;
  overallFeedback: string;
  suggestedImprovements: string[];
  skillsAssessed: SkillAssessment[];
  passesThreshold: boolean;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!getOpenAIKey()) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 });
    }

    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select('*, tasks(*)')
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const task = submission.tasks;
    if (!task) {
      return NextResponse.json({ error: 'Task not found for submission' }, { status: 404 });
    }

    const prompt = fillPrompt(CODE_REVIEW_PROMPT, {
      taskTitle: task.title,
      taskDescription: task.description,
      businessContext: task.business_context || '',
      acceptanceCriteria: (task.acceptance_criteria || []).map((c: string) => '- ' + c).join('\n'),
      techSkills: (task.tech_skills || []).join(', '),
      language: submission.language || 'javascript',
      code: submission.code,
    });

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI review failed' }, { status: 500 });
    }

    let review: ReviewResponse;
    try {
      review = parseAIResponse<ReviewResponse>(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const status = review.passesThreshold ? 'accepted' : 'reviewed';

    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        ai_review: {
          overallFeedback: review.overallFeedback,
          passesThreshold: review.passesThreshold,
        },
        overall_score: review.overallScore,
        scores: review.scores,
        skills_assessed: review.skillsAssessed,
        feedback: review.overallFeedback,
        suggested_improvements: review.suggestedImprovements,
        status,
      })
      .eq('id', id)
      .select('*, tasks(id, title, project_id, projects(repo_name))')
      .single();

    if (updateError || !updatedSubmission) {
      return NextResponse.json({ error: updateError?.message || 'Failed to update submission' }, { status: 500 });
    }

    let passportSkills = [];
    if (submission.student_id && review.skillsAssessed?.length) {
      passportSkills = await upsertStudentSkillEvidence(
        submission.student_id,
        review.skillsAssessed.map((skill) => ({
          skill: skill.skill,
          proficiency: skill.proficiency,
          confidence: 75,
          evidence: skill.evidence,
          submissionId: id,
          taskId: submission.task_id,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        ...updatedSubmission,
        task: updatedSubmission.tasks
          ? { ...updatedSubmission.tasks, project: updatedSubmission.tasks.projects }
          : undefined,
      } as Submission,
      passportSkills,
    });
  } catch (error) {
    console.error('POST existing submission review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
