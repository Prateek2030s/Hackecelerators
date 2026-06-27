import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');
    const skill = searchParams.get('skill');

    let query = supabaseAdmin
      .from('tasks')
      .select('*, projects(id, repo_name, repo_url, tech_stack, founder_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty);
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filteredTasks = tasks || [];
    if (skill) {
      filteredTasks = filteredTasks.filter((task) =>
        (task.tech_skills || []).some((s: string) =>
          s.toLowerCase().includes(skill.toLowerCase())
        )
      );
    }

    const formattedTasks = filteredTasks.map((task) => ({
      ...task,
      project: task.projects,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('GET tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
