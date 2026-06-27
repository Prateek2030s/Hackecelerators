import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
        <p className="text-sm text-zinc-500">Built at Build 2026 Hackathon</p>
        <p className="mt-2 text-xs text-zinc-600">
          #supcareer #build2026 #hackathon #PetaniAI
        </p>
        <Link
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-zinc-500 hover:text-amber-500"
        >
          View on GitHub
        </Link>
      </div>
    </footer>
  );
}
