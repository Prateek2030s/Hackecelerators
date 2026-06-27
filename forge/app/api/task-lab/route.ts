import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

type SimpleTask = {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate';
  estimatedTime: string;
  skills: string[];
  acceptanceCriteria: string[];
};

function parseGithubUrl(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
}

async function fetchTinyRepoContext(repoUrl: string) {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) throw new Error('Enter a valid GitHub repository URL.');

  const headers = { Accept: 'application/vnd.github+json' };
  const repoResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
    headers,
    next: { revalidate: 300 },
  });

  if (!repoResponse.ok) {
    throw new Error('Could not read that public GitHub repository.');
  }

  const repo = await repoResponse.json();
  let readme = '';

  try {
    const readmeResponse = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`, {
      headers,
      next: { revalidate: 300 },
    });
    if (readmeResponse.ok) {
      const readmeJson = await readmeResponse.json();
      readme = Buffer.from(readmeJson.content || '', 'base64').toString('utf8').slice(0, 1400);
    }
  } catch {
    readme = '';
  }

  return {
    name: repo.name || parsed.repo,
    description: repo.description || 'No repository description provided.',
    language: repo.language || 'Unknown',
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 6) : [],
    readme,
  };
}

function fallbackTasks(context: Awaited<ReturnType<typeof fetchTinyRepoContext>>): SimpleTask[] {
  const stack = context.language === 'Unknown' ? 'the main stack' : context.language;

  return [
    {
      title: 'Improve the project README quickstart',
      description: `Make the ${context.name} README easier for a new contributor to run locally. Add clear setup, run, and troubleshooting steps.`,
      difficulty: 'beginner',
      estimatedTime: '30-45 min',
      skills: ['Documentation', 'Developer Experience'],
      acceptanceCriteria: ['README has install steps', 'README has run steps', 'Common setup errors are documented'],
    },
    {
      title: 'Add basic input and error states',
      description: `Find one user-facing flow in ${context.name} and add simple validation plus helpful error messages. Keep the change small and easy to review.`,
      difficulty: 'beginner',
      estimatedTime: '1 hour',
      skills: [stack, 'Error Handling'],
      acceptanceCriteria: ['Invalid input is rejected', 'Users see a helpful message', 'Existing behavior still works'],
    },
    {
      title: 'Add a smoke test for the main flow',
      description: `Create one lightweight test that proves the core ${context.name} workflow still loads or runs successfully.`,
      difficulty: 'intermediate',
      estimatedTime: '1-2 hours',
      skills: ['Testing', stack],
      acceptanceCriteria: ['Test covers the main happy path', 'Test can run with the existing test command', 'Failure output is understandable'],
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl || typeof repoUrl !== 'string') {
      return NextResponse.json({ error: 'Repository URL is required.' }, { status: 400 });
    }

    const context = await fetchTinyRepoContext(repoUrl);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ repo: context, tasks: fallbackTasks(context), source: 'fallback' });
    }

    const prompt = `Generate exactly 3 simple beginner-friendly engineering tasks for this public GitHub repo. Keep output concise and cheap.\n\nRepo: ${context.name}\nDescription: ${context.description}\nLanguage: ${context.language}\nTopics: ${context.topics.join(', ') || 'none'}\nREADME excerpt: ${context.readme || 'none'}\n\nReturn only JSON: {"tasks":[{"title":"","description":"","difficulty":"beginner|intermediate","estimatedTime":"","skills":[""],"acceptanceCriteria":[""]}]}`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    const parsed = content ? JSON.parse(content) as { tasks?: SimpleTask[] } : {};
    const tasks = Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks.slice(0, 3) : fallbackTasks(context);

    return NextResponse.json({ repo: context, tasks, source: 'openai' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate tasks.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
