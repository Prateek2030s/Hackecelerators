'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Submission } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/shared/ScoreBar';
import { getScoreColor } from '@/lib/utils';

interface SubmissionListItemProps {
  submission: Submission;
}

export function SubmissionListItem({ submission }: SubmissionListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = getScoreColor(submission.overall_score);

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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-50">{submission.student_name}</p>
          <p className="truncate text-sm text-zinc-500">
            {submission.task?.title || 'Unknown task'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-heading text-2xl font-bold ${scoreColor}`}>
            {submission.overall_score}
          </span>
          <Badge variant="outline" className="border-zinc-700 capitalize">
            {submission.status}
          </Badge>
          <span className="hidden text-xs text-zinc-500 sm:inline">
            {new Date(submission.created_at).toLocaleDateString()}
          </span>
          {expanded ? (
            <ChevronUp className="size-4 text-zinc-500" />
          ) : (
            <ChevronDown className="size-4 text-zinc-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-zinc-800 p-4">
          <div className="space-y-3">
            {scoreEntries.map((entry, i) => (
              <ScoreBar
                key={entry.label}
                label={entry.label}
                score={entry.score}
                feedback={entry.feedback}
                index={i}
              />
            ))}
          </div>

          {submission.feedback && (
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-300">AI Feedback</h4>
              <p className="mt-1 text-sm text-zinc-400">{submission.feedback}</p>
            </div>
          )}

          {submission.suggested_improvements?.length > 0 && (
            <div>
              <h4 className="font-heading text-sm font-semibold text-zinc-300">
                Suggested Improvements
              </h4>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
                {submission.suggested_improvements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <h4 className="font-heading text-sm font-semibold text-zinc-300">Submitted Code</h4>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-300">
              {submission.code}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
