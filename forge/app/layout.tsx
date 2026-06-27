import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Forge — Build Real Software',
  description:
    'Forge transforms GitHub repositories into structured engineering tasks for CS students. AI-powered task generation and code review.',
  openGraph: {
    title: 'Forge — Build Real Software',
    description:
      'Where students build real software. Where startups discover real talent.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} min-h-screen bg-zinc-950 font-sans text-zinc-50 antialiased`}
      >
        <TooltipProvider>
          <Navbar />
          <main className="flex min-h-screen flex-1 flex-col pt-16">{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
