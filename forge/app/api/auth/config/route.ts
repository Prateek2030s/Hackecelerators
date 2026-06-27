import { NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase';

export async function GET() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.json(
      { error: 'Supabase public auth config is missing.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ supabaseUrl, supabaseAnonKey });
}
