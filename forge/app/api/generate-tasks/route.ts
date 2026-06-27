import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { supabaseAdmin } from '@/lib/supabase';
import { TASK_GENERATION_PROMPT } from '@/lib/prompts';
import { fillPrompt, parseAIResponse } from '@/lib/utils';
import type { RepoSummary, Task } from '@/types';

interface GeneratedTask {
  title: string;
  description: string;
  businessContext: string;
  architectureContext: string;
  relevantFiles: string[];
  acceptanceCriteria: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  techSkills: string[];
  estimatedTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, repoSummary, repoName, count = 3 } = await request.json();

    if (!projectId || !repoSummary || !repoName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const summary = repoSummary as RepoSummary;

    const prompt = fillPrompt(TASK_GENERATION_PROMPT, {
      count,
      repoName,
      summary: summary.summary,
      techStack: summary.techStack.join(', '),
      architecture: summary.architecture,
      businessContext: summary.businessContext,
      keyModules: JSON.stringify(summary.keyModules),
    });

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI task generation failed' }, { status: 500 });
    }

    let parsed: { tasks: GeneratedTask[] };
    try {
      parsed = parseAIResponse<{ tasks: GeneratedTask[] }>(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const insertedTasks: Task[] = [];

    for (const task of parsed.tasks) {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          project_id: projectId,
          title: task.title,
          description: task.description,
          business_context: task.businessContext,
          architecture_context: task.architectureContext,
          relevant_files: task.relevantFiles,
          acceptance_criteria: task.acceptanceCriteria,
          difficulty: task.difficulty,
          tech_skills: task.techSkills,
          estimated_time: task.estimatedTime,
        })
        .select()
        .single();

      if (error) {
        console.error('Task insert error:', error);
        continue;
      }
      insertedTasks.push(data as Task);
    }

    return NextResponse.json({ success: true, tasks: insertedTasks });
  } catch (error) {
    console.error('generate-tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
