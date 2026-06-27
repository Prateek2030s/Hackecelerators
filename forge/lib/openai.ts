import OpenAI from 'openai';
import { getForgeEnv } from '@/lib/supabase';

let _openai: OpenAI | null = null;

export function getOpenAIKey() {
  return getForgeEnv('OPENAI_API_KEY') || getForgeEnv('OPEN_API_KEY');
}

export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: getOpenAIKey(),
    });
  }
  return _openai;
}
