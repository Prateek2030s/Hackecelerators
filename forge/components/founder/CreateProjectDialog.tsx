'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { RepoSummary } from '@/types';

const ANALYSIS_MESSAGES = [
  'Fetching repository structure...',
  'Analyzing architecture...',
  'Understanding business logic...',
  'Generating engineering tasks...',
];

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectDialog({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const [founderName, setFounderName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [analysis, setAnalysis] = useState<RepoSummary | null>(null);
  const [repoName, setRepoName] = useState('');
  const [repoDescription, setRepoDescription] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'analysis' | 'generating'>('form');

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ANALYSIS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const reset = () => {
    setFounderName('');
    setRepoUrl('');
    setAnalysis(null);
    setError('');
    setStep('form');
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!founderName.trim() || !repoUrl.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setStep('analysis');

    try {
      const res = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setAnalysis(data.analysis);
      setRepoName(data.repoName);
      setRepoDescription(data.repoDescription);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setLoading(false);
      setStep('form');
    }
  };

  const handleConfirm = async () => {
    if (!analysis) return;

    setLoading(true);
    setStep('generating');

    try {
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founder_name: founderName,
          repo_url: repoUrl,
          repo_name: repoName,
          repo_description: repoDescription,
          repo_summary: analysis,
          tech_stack: analysis.techStack,
          architecture_overview: analysis.architecture,
        }),
      });

      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error || 'Failed to create project');

      const tasksRes = await fetch('/api/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectData.project.id,
          repoSummary: analysis,
          repoName,
          count: 3,
        }),
      });

      const tasksData = await tasksRes.json();
      if (!tasksRes.ok) throw new Error(tasksData.error || 'Failed to generate tasks');

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setLoading(false);
      setStep('analysis');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          if (!v) reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg w-[95vw] overflow-y-auto border-zinc-800 bg-zinc-900 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-zinc-50">Connect a Repository</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Paste a public GitHub URL and Forge will analyze it to generate engineering tasks.
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Your Name</label>
              <Input
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="Jane Founder"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">GitHub Repository URL</label>
              <Input
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="border-zinc-700 bg-zinc-950"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleAnalyze}
              className="min-h-[44px] w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Analyze Repository
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="size-10 animate-spin text-amber-500" />
            <p className="text-center text-zinc-400">{ANALYSIS_MESSAGES[messageIndex]}</p>
          </div>
        )}

        {step === 'analysis' && analysis && !loading && (
          <div className="space-y-4">
            <div>
              <h4 className="font-heading font-semibold text-zinc-50">Summary</h4>
              <p className="mt-1 text-sm text-zinc-400">{analysis.summary}</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-zinc-50">Tech Stack</h4>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.techStack.map((tech) => (
                  <Badge key={tech} variant="outline" className="border-zinc-700 bg-zinc-800">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-zinc-50">Architecture</h4>
              <p className="mt-1 text-sm text-zinc-400">{analysis.architecture}</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleConfirm}
              className="min-h-[44px] w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
            >
              Confirm & Generate Tasks
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
