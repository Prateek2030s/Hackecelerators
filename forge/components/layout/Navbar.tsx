'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/founder', label: 'For Founders' },
  { href: '/student', label: 'For Students' },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-heading text-xl font-bold text-zinc-50 hover:text-amber-500">
          ⚒️ Forge
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

        <div className="hidden items-center gap-2 md:flex">
          <Button render={<Link href="/auth/login" />} variant="ghost" className="text-zinc-400 hover:text-zinc-50">
            Sign in
          </Button>
          <Button render={<Link href="/auth/sign-up" />} className="bg-amber-500 text-zinc-950 hover:bg-amber-400">
            Join Forge
          </Button>
        </div>

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
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
