import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseAIResponse<T>(response: string): T {
  const cleaned = response.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(cleaned) as T;
}

export function getScoreColor(score: number): string {
  if (score < 40) return 'text-red-500';
  if (score < 70) return 'text-amber-500';
  return 'text-emerald-500';
}

export function getScoreBarColor(score: number): string {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getScoreStrokeColor(score: number): string {
  if (score < 40) return '#ef4444';
  if (score < 70) return '#f59e0b';
  return '#10b981';
}

export function fillPrompt(template: string, values: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function detectLanguageFromTechStack(techStack: string[]): string {
  const stack = techStack.map((s) => s.toLowerCase()).join(' ');
  if (stack.includes('python') || stack.includes('django') || stack.includes('flask')) return 'python';
  if (stack.includes('typescript')) return 'typescript';
  if (stack.includes('java')) return 'java';
  if (stack.includes('go') || stack.includes('golang')) return 'go';
  if (stack.includes('rust')) return 'rust';
  return 'javascript';
}
