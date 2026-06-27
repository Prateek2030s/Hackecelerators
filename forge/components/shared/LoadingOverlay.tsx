'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  messages: string[];
  isVisible: boolean;
}

export function LoadingOverlay({ messages, isVisible }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <Loader2 className="size-16 animate-spin text-amber-500" />
        <p className="font-heading text-xl text-zinc-200">{messages[messageIndex]}</p>
      </div>
    </div>
  );
}
