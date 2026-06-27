import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import { CODE_REVIEW_PROMPT } from '@/lib/prompts';
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

export async function POST(request: NextRequest) {
  try {
    const { taskId, studentName, code, language, studentEmail } = await request.json();

    if (!taskId || !studentName || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const prompt = fillPrompt(CODE_REVIEW_PROMPT, {
      taskTitle: task.title,
      taskDescription: task.description,
      businessContext: task.business_context || '',
      acceptanceCriteria: (task.acceptance_criteria || []).map((c: string) => `- ${c}`).join('\n'),
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

    const { data: submission, error: insertError } = await supabaseAdmin
      .from('submissions')
      .insert({
        task_id: taskId,
        student_name: studentName,
        student_email: studentEmail || null,
        code,
        language: language || 'javascript',
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
      .select()
      .single();

    if (insertError) {
      console.error('Submission insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: submission as Submission });
  } catch (error) {
    console.error('review-submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
