import { NextRequest, NextResponse } from 'next/server';
import { fetchRepoData } from '@/lib/github';
import { getOpenAI } from '@/lib/openai';
import { REPO_ANALYSIS_PROMPT } from '@/lib/prompts';
import { fillPrompt, parseAIResponse } from '@/lib/utils';
import type { RepoSummary } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    let repoData;
    try {
      repoData = await fetchRepoData(repoUrl);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err.status === 403) {
        return NextResponse.json(
          { error: 'GitHub rate limit reached, try again in a few minutes' },
          { status: 400 }
        );
      }
      if (err.status === 404) {
        return NextResponse.json({ error: 'Repository not found. Check the URL and try again.' }, { status: 400 });
      }
      return NextResponse.json(
        { error: err.message || 'Failed to fetch repository from GitHub' },
        { status: 400 }
      );
    }

    const prompt = fillPrompt(REPO_ANALYSIS_PROMPT, {
      repoName: repoData.name,
      repoDescription: repoData.description,
      language: repoData.language,
      fileTree: repoData.fileTree,
      readme: repoData.readme,
      manifest: repoData.manifest,
      sourceFiles: repoData.sourceFiles,
    });

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    let analysis: RepoSummary;
    try {
      analysis = parseAIResponse<RepoSummary>(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis,
      repoName: repoData.name,
      repoDescription: repoData.description,
    });
  } catch (error) {
    console.error('analyze-repo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
