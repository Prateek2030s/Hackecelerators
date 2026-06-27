'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn, getScoreBarColor } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  feedback?: string;
  index?: number;
}

export function ScoreBar({ label, score, feedback, index = 0 }: ScoreBarProps) {
  const [expanded, setExpanded] = useState(false);
  const barColor = getScoreBarColor(score);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-zinc-300">{label}</span>
        <span className={cn('font-heading font-bold', barColor.replace('bg-', 'text-'))}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
        />
      </div>
      {feedback && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-left text-xs text-zinc-500 hover:text-zinc-400"
        >
          {expanded ? feedback : 'Show feedback →'}
        </button>
      )}
    </div>
  );
}
