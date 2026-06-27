'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, GraduationCap, Loader2, LockKeyhole, Mail, User } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Role = 'student' | 'founder';

type AuthFormProps = {
  mode: 'login' | 'signup';
};

function dashboardForRole(role: Role) {
  return role === 'founder' ? '/founder' : '/student';
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function getSupabaseClient() {
    const response = await fetch('/api/auth/config');
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || 'Supabase auth config is missing.');

    return createClient(config.supabaseUrl, config.supabaseAnonKey);
  }

  async function syncAppUser(userId: string, selectedRole: Role, displayName: string, userEmail: string) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_auth_id: userId,
        role: selectedRole,
        name: displayName || userEmail.split('@')[0],
        email: userEmail,
        image_url: null,
      }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not create Forge profile.');
    return payload.user as { id: string; role: Role };
  }

  async function findAppUser(userEmail: string) {
    const response = await fetch('/api/users?email=' + encodeURIComponent(userEmail));
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Could not load Forge profile.');
    return payload.users?.[0] as { id: string; role: Role; name: string; email: string } | undefined;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const normalizedEmail = normalizeEmail(email);
      const normalizedName = name.trim();

      if (!normalizedEmail || !password || (mode === 'signup' && !normalizedName)) {
        throw new Error('Fill in the required fields.');
      }

      if (!isValidEmail(normalizedEmail)) {
        throw new Error('Enter a valid email address.');
      }

      const supabase = await getSupabaseClient();

      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { role, name: normalizedName } },
        });

        if (signUpError) throw signUpError;
        if (!data.user?.id) throw new Error('Account was not created.');

        await syncAppUser(data.user.id, role, normalizedName, normalizedEmail);
        router.push(dashboardForRole(role));
        router.refresh();
        return;
      }

      const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (loginError) throw loginError;
      if (!data.user?.id || !data.user.email) throw new Error('Could not load signed-in user.');

      const existingUser = await findAppUser(data.user.email);
      const metadataRole = data.user.user_metadata?.role as Role | undefined;
      const resolvedRole = existingUser?.role || metadataRole || role;

      if (!existingUser) {
        await syncAppUser(
          data.user.id,
          resolvedRole,
          data.user.user_metadata?.name || data.user.email.split('@')[0],
          data.user.email
        );
      }

      router.push(dashboardForRole(resolvedRole));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  }

  const isSignup = mode === 'signup';
  const roleOptions: Array<{ value: Role; label: string; icon: typeof GraduationCap }> = [
    { value: 'student', label: 'Student', icon: GraduationCap },
    { value: 'founder', label: 'Founder', icon: BriefcaseBusiness },
  ];

  return (
    <Card className="w-full border-zinc-800 bg-zinc-950/90 shadow-2xl shadow-black/30">
      <CardHeader>
        <CardTitle className="font-heading text-2xl text-zinc-50">
          {isSignup ? 'Create your Forge account' : 'Welcome back'}
        </CardTitle>
        <CardDescription>
          {isSignup ? 'Choose your role and join the apprenticeship workspace.' : 'Sign in and continue where your team left off.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {isSignup && (
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={cn(
                      'flex min-h-[76px] flex-col items-start justify-center gap-2 rounded-lg border p-4 text-left transition-colors',
                      role === option.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {isSignup && (
            <label className="block space-y-1.5">
              <span className="text-sm text-zinc-400">Name</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada Lovelace" className="h-11 border-zinc-700 bg-zinc-900 pl-10 text-zinc-50" />
              </div>
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm text-zinc-400">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 border-zinc-700 bg-zinc-900 pl-10 text-zinc-50" />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm text-zinc-400">Password</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" className="h-11 border-zinc-700 bg-zinc-900 pl-10 text-zinc-50" />
            </div>
          </label>

          {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}

          <Button type="submit" disabled={isLoading} className="h-11 w-full bg-amber-500 text-zinc-950 hover:bg-amber-400">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            {isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-zinc-500">
          {isSignup ? 'Already have an account?' : 'New to Forge?'}{' '}
          <Link href={isSignup ? '/auth/login' : '/auth/sign-up'} className="font-medium text-amber-400 hover:text-amber-300">
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
