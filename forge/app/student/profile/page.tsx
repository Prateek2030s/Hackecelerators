'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Submission } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreCircle } from '@/components/shared/ScoreCircle';
import { getScoreColor } from '@/lib/utils';

interface AggregatedSkill {
  skill: string;
  avgProficiency: number;
  count: number;
  bestEvidence: string;
}

function aggregateSkills(submissions: Submission[]): AggregatedSkill[] {
  const skillMap = new Map<string, { total: number; count: number; bestEvidence: string; bestScore: number }>();

  for (const sub of submissions) {
    for (const assessment of sub.skills_assessed || []) {
      const existing = skillMap.get(assessment.skill);
      if (existing) {
        existing.total += assessment.proficiency;
        existing.count += 1;
        if (assessment.proficiency > existing.bestScore) {
          existing.bestScore = assessment.proficiency;
          existing.bestEvidence = assessment.evidence;
        }
      } else {
        skillMap.set(assessment.skill, {
          total: assessment.proficiency,
          count: 1,
          bestEvidence: assessment.evidence,
          bestScore: assessment.proficiency,
        });
      }
    }
  }

  return Array.from(skillMap.entries())
    .map(([skill, data]) => ({
      skill,
      avgProficiency: Math.round(data.total / data.count),
      count: data.count,
      bestEvidence: data.bestEvidence,
    }))
    .sort((a, b) => b.avgProficiency - a.avgProficiency);
}

function SubmissionHistoryItem({ submission }: { submission: Submission }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex min-h-[44px] w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="font-medium text-zinc-50">
            {submission.task?.title || 'Unknown task'}
          </p>
          <p className="text-xs text-zinc-500">
            {new Date(submission.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-heading text-xl font-bold ${getScoreColor(submission.overall_score)}`}>
            {submission.overall_score}
          </span>
          <Badge variant="outline" className="border-zinc-700 capitalize">
            {submission.status}
          </Badge>
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>
      {expanded && submission.feedback && (
        <p className="border-t border-zinc-800 p-4 text-sm text-zinc-400">{submission.feedback}</p>
      )}
    </div>
  );
}

export default function StudentProfilePage() {
  const [name, setName] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/submissions?student_name=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');
      setSubmissions(data.submissions || []);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const skills = aggregateSkills(submissions);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 lg:px-16">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name to view your profile"
          className="min-h-[44px] flex-1 border-zinc-700 bg-zinc-900"
          onKeyDown={(e) => e.key === 'Enter' && loadProfile()}
        />
        <Button
          onClick={loadProfile}
          disabled={loading}
          className="min-h-[44px] bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          {loading ? 'Loading...' : 'Load Profile'}
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {loaded && (
        <>
          <div className="mt-8">
            <h1 className="font-heading text-3xl font-bold text-zinc-50">Engineering Skill Passport</h1>
            <p className="mt-2 text-zinc-400">
              {name} · {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
            </p>
          </div>

          {skills.length === 0 && submissions.length === 0 && (
            <p className="mt-8 text-center text-zinc-500">
              No submissions found for this name. Complete a task first!
            </p>
          )}

          {skills.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <div
                  key={skill.skill}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-zinc-50">{skill.skill}</h3>
                    <ScoreCircle score={skill.avgProficiency} size={64} />
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    Assessed in {skill.count} task{skill.count !== 1 ? 's' : ''}
                  </p>
                  <p className="mt-3 line-clamp-3 text-xs text-zinc-400">{skill.bestEvidence}</p>
                </div>
              ))}
            </div>
          )}

          {submissions.length > 0 && (
            <div className="mt-12">
              <h2 className="font-heading text-xl font-bold text-zinc-50">Submission History</h2>
              <div className="mt-4 space-y-3">
                {submissions.map((sub) => (
                  <SubmissionHistoryItem key={sub.id} submission={sub} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
