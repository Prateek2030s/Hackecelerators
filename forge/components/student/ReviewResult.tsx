'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Submission } from '@/types';
import { ScoreCircle } from '@/components/shared/ScoreCircle';
import { ScoreBar } from '@/components/shared/ScoreBar';
import { SkillBadge } from '@/components/student/SkillBadge';
import { Button } from '@/components/ui/button';

interface ReviewResultProps {
  submission: Submission;
}

export function ReviewResult({ submission }: ReviewResultProps) {
  const passes = submission.ai_review?.passesThreshold ?? submission.overall_score >= 70;

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <ScoreCircle score={submission.overall_score} size={140} />
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-heading text-2xl font-bold text-zinc-50">AI Review</h3>
          <p className="mt-2 text-zinc-400">
            {submission.feedback || submission.ai_review?.overallFeedback}
          </p>
          <p
            className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-medium ${
              passes
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {passes ? 'Passed ✓' : 'Needs Improvement'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
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

      {(submission.skills_assessed?.length ?? 0) > 0 && (
        <div>
          <h4 className="font-heading mb-3 font-semibold text-zinc-50">Skills Assessed</h4>
          <div className="flex flex-wrap gap-2">
            {submission.skills_assessed.map((skill) => (
              <SkillBadge key={skill.skill} skill={skill.skill} proficiency={skill.proficiency} />
            ))}
          </div>
        </div>
      )}

      {submission.suggested_improvements?.length > 0 && (
        <div>
          <h4 className="font-heading mb-3 font-semibold text-zinc-50">Suggested Improvements</h4>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            {submission.suggested_improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          render={<Link href="/student" />}
          variant="outline"
          className="min-h-[44px] flex-1 border-zinc-700"
        >
          Back to Tasks
        </Button>
        <Button
          render={<Link href="/student/profile" />}
          className="min-h-[44px] flex-1 bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          View Profile
        </Button>
      </div>
    </motion.div>
  );
}
