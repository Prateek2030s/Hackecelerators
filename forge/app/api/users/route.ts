import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

function isRole(role: unknown): role is 'founder' | 'student' {
  return role === 'founder' || role === 'student';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const email = searchParams.get('email');

    let query = supabaseAdmin
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role && role !== 'all') query = query.eq('role', role);
    if (email) query = query.ilike('email', email);

    const { data: users, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { external_auth_id, role, name, email, image_url } = body;

    if (!isRole(role) || !name || !email) {
      return NextResponse.json({ error: 'role, name, and email are required' }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from('app_users')
      .upsert(
        {
          external_auth_id: external_auth_id || null,
          role,
          name,
          email,
          image_url: image_url || null,
        },
        { onConflict: external_auth_id ? 'external_auth_id' : 'email' }
      )
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('POST users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
