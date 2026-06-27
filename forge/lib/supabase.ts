import fs from 'node:fs';
import path from 'node:path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;
const envCache = new Map<string, string>();

function parseEnvFile() {
  if (envCache.size > 0) return;

  const candidates = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      const value = rawValue.replace(/^['\"]|['\"]$/g, '');
      if (!envCache.has(key)) envCache.set(key, value);
    }
  }
}

export function getForgeEnv(key: string) {
  parseEnvFile();
  return process.env[key] || envCache.get(key) || '';
}

function cleanSupabaseUrl(value: string) {
  const nestedAssignment = value.match(/(?:^|\s)NEXT_PUBLIC_SUPABASE_URL=(https?:\/\/\S+)/);
  const rawUrl = nestedAssignment?.[1] || value;
  return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
}

export function getSupabaseUrl() {
  return cleanSupabaseUrl(getForgeEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder.supabase.co');
}

function cleanSupabaseKey(value: string) {
  const nestedAssignment = value.match(/(?:^|\s)(?:NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)=([^\s]+)/);
  return nestedAssignment?.[1] || value;
}

export function getSupabaseAnonKey() {
  return cleanSupabaseKey(
    getForgeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getForgeEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 'placeholder-anon-key'
  );
}

function getSupabaseServiceKey() {
  return getForgeEnv('SUPABASE_SERVICE_ROLE_KEY') || getSupabaseAnonKey();
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return Reflect.get(_supabase, prop, _supabase);
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceKey());
    }
    return Reflect.get(_supabaseAdmin, prop, _supabaseAdmin);
  },
});
