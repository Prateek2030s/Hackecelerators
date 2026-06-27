'use client';

import { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronUp, Loader2, RotateCcw } from 'lucide-react';
import type { Submission } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBar } from '@/components/shared/ScoreBar';
import { getScoreColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SubmissionListItemProps {
  submission: Submission;
  onReviewUpdated?: (submission: Submission) => void;
}

export function SubmissionListItem({ submission, onReviewUpdated }: SubmissionListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const scoreColor = getScoreColor(submission.overall_score);
  const hasReview = Boolean(submission.feedback || submission.overall_score > 0 || submission.scores);

  const scoreEntries = submission.scores
    ? [
        { label: 'Correctness', ...submission.scores.correctness },
        { label: 'Code Quality', ...submission.scores.codeQuality },
        { label: 'Security', ...submission.scores.security },
        { label: 'Scalability', ...submission.scores.scalability },
        { label: 'Business Logic', ...submission.scores.businessLogic },
        { label: 'Testing', ...submission.scores.testing },
      ]
    : [];

  async function runReview() {
    setReviewing(true);
    setReviewError('');

    try {
      const response = await fetch('/api/submissions/' + submission.id + '/review', {
        method: 'POST',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Review failed');
      onReviewUpdated?.(payload.submission);
      setExpanded(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Review failed');
    } finally {
      setReviewing(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-50">{submission.student_name}</p>
          <p className="truncate text-sm text-zinc-500">{submission.task?.title || 'Unknown task'}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasReview ? (
            <span className={cn('font-heading text-2xl font-bold', scoreColor)}>{submission.overall_score}</span>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 text-amber-300">Needs review</Badge>
          )}
          <Badge variant="outline" className="border-zinc-700 capitalize">{submission.status}</Badge>
          <span className="hidden text-xs text-zinc-500 sm:inline">{new Date(submission.created_at).toLocaleDateString()}</span>
          {expanded ? <ChevronUp className="size-4 text-zinc-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-zinc-800 p-4">
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-200">AI Code Review</h4>
              <p className="mt-1 text-xs text-zinc-500">
                {hasReview ? 'Review analysis is stored with this submission.' : 'Run the same OpenAI review used by the student submission flow.'}
              </p>
            </div>
            <Button type="button" onClick={runReview} disabled={reviewing} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
              {reviewing ? <Loader2 className="size-4 animate-spin" /> : hasReview ? <RotateCcw className="size-4" /> : <BrainCircuit className="size-4" />}
              {hasReview ? 'Re-run review' : 'Run AI review'}
            </Button>
          </div>

          {reviewError ? <p className="text-sm text-red-400">{reviewError}</p> : null}

          {scoreEntries.length > 0 && (
            <div className="space-y-3">
              {scoreEntries.map((entry, i) => (
                <ScoreBar key={entry.label} label={entry.label} score={entry.score} feedback={entry.feedback} index={i} />
              ))}
            </div>
          )}

          {submission.feedback && (
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-300">AI Feedback</h4>
              <p className="mt-1 text-sm text-zinc-400">{submission.feedback}</p>
            </div>
          )}

          {(submission.skills_assessed?.length ?? 0) > 0 && (
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-300">Skills Assessed</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {submission.skills_assessed.map((skill) => (
                  <Badge key={skill.skill} variant="secondary">{skill.skill}: {skill.proficiency}%</Badge>
                ))}
              </div>
            </div>
          )}

          {submission.suggested_improvements?.length > 0 && (
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-300">Suggested Improvements</h4>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
                {submission.suggested_improvements.map((item, i) => (<li key={i}>{item}</li>))}
              </ol>
            </div>
          )}

          <div>
            <h4 className="font-heading text-sm font-semibold text-zinc-300">Submitted Code</h4>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-300">{submission.code}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
