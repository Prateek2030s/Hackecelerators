'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-16">
      <div className="forge-grid absolute inset-0 opacity-30" />
      <div className="forge-gradient absolute inset-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-zinc-50 md:text-7xl">
          <span className="inline-block animate-pulse">⚒️</span> Forge
        </h1>
        <p className="mt-6 text-xl text-zinc-400">
          Where students build real software. Where startups discover real talent.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            render={<Link href="/founder" />}
            className="min-h-[44px] w-full bg-amber-500 px-8 text-zinc-950 hover:bg-amber-400 sm:w-auto"
            size="lg"
          >
            I&apos;m a Founder
          </Button>
          <Button
            render={<Link href="/student" />}
            variant="outline"
            className="min-h-[44px] w-full border-zinc-700 text-zinc-300 hover:border-amber-500 sm:w-auto"
            size="lg"
          >
            I&apos;m a Student
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
