'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

interface CodeWorkspaceProps {
  taskTitle: string;
  defaultLanguage: string;
  studentName: string;
  onStudentNameChange: (name: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
}

export function CodeWorkspace({
  taskTitle,
  defaultLanguage,
  studentName,
  onStudentNameChange,
  code,
  onCodeChange,
  language,
  onLanguageChange,
  onSubmit,
  submitting,
}: CodeWorkspaceProps) {
  const [isMobile, setIsMobile] = useState(false);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!initialized) {
      onCodeChange(`// Write your solution here\n// Task: ${taskTitle}\n`);
      if (!language) onLanguageChange(defaultLanguage);
      setInitialized(true);
    }
  }, [initialized, taskTitle, defaultLanguage, language, onCodeChange, onLanguageChange]);

  const editorPanel = (
    <div className="flex h-[70vh] min-h-[420px] flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 md:h-[calc(100vh-12rem)] md:min-h-[520px] md:max-h-[760px]">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 p-3">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-300"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <Input
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Your name (optional)"
          className="min-h-[44px] flex-1 border-zinc-700 bg-zinc-950"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {isMobile ? (
          <textarea
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            className="mobile-code-editor h-full w-full resize-none bg-zinc-950 p-4 font-mono text-sm text-zinc-300 outline-none"
            spellCheck={false}
          />
        ) : (
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={(value) => onCodeChange(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="min-h-[44px] w-full bg-amber-500 text-zinc-950 hover:bg-amber-400"
        >
          Submit Solution
        </Button>
      </div>
    </div>
  );

  return editorPanel;
}

export function CodeWorkspaceMobileTabs({
  taskPanel,
  codePanel,
}: {
  taskPanel: React.ReactNode;
  codePanel: React.ReactNode;
}) {
  const [tab, setTab] = useState<'task' | 'code'>('task');

  return (
    <div className="md:hidden">
      <div className="mb-4 flex rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setTab('task')}
          className={`min-h-[44px] flex-1 rounded-md text-sm font-medium ${
            tab === 'task' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
          }`}
        >
          📋 Task
        </button>
        <button
          type="button"
          onClick={() => setTab('code')}
          className={`min-h-[44px] flex-1 rounded-md text-sm font-medium ${
            tab === 'code' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
          }`}
        >
          💻 Code
        </button>
      </div>
      {tab === 'task' ? taskPanel : codePanel}
    </div>
  );
}
