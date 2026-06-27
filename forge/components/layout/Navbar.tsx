'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type Role = 'founder' | 'student';

type NavUser = {
  email: string;
  name: string;
  role: Role;
};

const navLinks = [
  { href: '/founder', label: 'For Founders' },
  { href: '/student', label: 'For Students' },
];

function dashboardForRole(role: Role) {
  return role === 'founder' ? '/founder' : '/student';
}

async function createBrowserSupabaseClient() {
  const response = await fetch('/api/auth/config');
  const config = await response.json();
  if (!response.ok) throw new Error(config.error || 'Supabase auth config is missing.');
  return createClient(config.supabaseUrl, config.supabaseAnonKey);
}

async function loadForgeUser(email: string, fallbackRole?: Role): Promise<NavUser> {
  const response = await fetch('/api/users?email=' + encodeURIComponent(email));
  const payload = await response.json();
  const appUser = response.ok ? payload.users?.[0] : null;

  return {
    email,
    name: appUser?.name || email.split('@')[0],
    role: appUser?.role || fallbackRole || 'student',
  };
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<NavUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function bootAuth() {
      try {
        const client = await createBrowserSupabaseClient();
        if (!active) return;
        setSupabase(client);

        const { data } = await client.auth.getSession();
        const sessionUser = data.session?.user;
        if (sessionUser?.email) {
          const fallbackRole = sessionUser.user_metadata?.role as Role | undefined;
          const forgeUser = await loadForgeUser(sessionUser.email, fallbackRole);
          if (active) setUser(forgeUser);
        } else if (active) {
          setUser(null);
        }

        const listener = client.auth.onAuthStateChange(async (_event, session) => {
          const sessionUser = session?.user;
          if (sessionUser?.email) {
            const fallbackRole = sessionUser.user_metadata?.role as Role | undefined;
            const forgeUser = await loadForgeUser(sessionUser.email, fallbackRole);
            if (active) setUser(forgeUser);
          } else if (active) {
            setUser(null);
          }
        });

        unsubscribe = () => listener.data.subscription.unsubscribe();
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthReady(true);
      }
    }

    bootAuth();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function handleSignOut() {
    await supabase?.auth.signOut();
    setUser(null);
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  function AuthActions({ mobile = false }: { mobile?: boolean }) {
    if (!authReady) {
      return <div className={cn('h-9 w-28 rounded-lg bg-zinc-800/70', mobile && 'h-11 w-full')} />;
    }

    if (!user) {
      if (mobile) {
        return (
          <>
            <Link href="/auth/login" onClick={() => setOpen(false)} className="min-h-[44px] flex items-center text-lg font-medium text-zinc-300">
              Sign in
            </Link>
            <Link href="/auth/sign-up" onClick={() => setOpen(false)} className="min-h-[44px] flex items-center text-lg font-medium text-amber-400">
              Join Forge
            </Link>
          </>
        );
      }

      return (
        <div className="hidden items-center gap-2 md:flex">
          <Button render={<Link href="/auth/login" />} variant="ghost" className="text-zinc-400 hover:text-zinc-50">
            Sign in
          </Button>
          <Button render={<Link href="/auth/sign-up" />} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            Join Forge
          </Button>
        </div>
      );
    }

    const dashboardHref = dashboardForRole(user.role);
    const dashboardLabel = user.role === 'founder' ? 'Founder Dashboard' : 'Student Dashboard';

    if (mobile) {
      return (
        <>
          <Link href={dashboardHref} onClick={() => setOpen(false)} className="min-h-[44px] flex items-center text-lg font-medium text-amber-400">
            {dashboardLabel}
          </Link>
          <button type="button" onClick={handleSignOut} className="min-h-[44px] text-left text-lg font-medium text-zinc-300">
            Sign out
          </button>
        </>
      );
    }

    return (
      <div className="hidden items-center gap-3 md:flex">
        <div className="max-w-40 truncate text-right text-sm text-zinc-400">
          <span className="block truncate text-zinc-200">{user.name}</span>
          <span className="capitalize">{user.role}</span>
        </div>
        <Button render={<Link href={dashboardHref} />} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
          {dashboardLabel}
        </Button>
        <Button type="button" onClick={handleSignOut} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-zinc-50">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <header className="fixed top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-heading text-xl font-bold text-zinc-50 hover:text-amber-500">
          Forge
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'min-h-[44px] flex items-center text-sm font-medium transition-colors',
                pathname.startsWith(link.href)
                  ? 'text-amber-500'
                  : 'text-zinc-400 hover:text-zinc-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <AuthActions />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            }
          />
          <SheetContent side="right" className="border-zinc-800 bg-zinc-950">
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'min-h-[44px] flex items-center text-lg font-medium',
                    pathname.startsWith(link.href) ? 'text-amber-500' : 'text-zinc-300'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <AuthActions mobile />
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
