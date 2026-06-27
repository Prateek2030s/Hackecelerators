import Link from 'next/link';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <section className="px-4 py-24 text-center md:px-8 lg:px-16">
        <h2 className="font-heading text-2xl font-bold text-zinc-50 md:text-3xl">
          Ready to forge the next generation of engineers?
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
      </section>
    </>
  );
}
