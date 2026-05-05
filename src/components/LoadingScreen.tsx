import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "Initializing your workspace...",
  "Securing your connection...",
  "Loading your feedback dashboard...",
  "Almost there...",
  "Preparing a premium experience...",
];

export function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 size-96 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 size-96 bg-secondary/10 rounded-full blur-[100px] animate-pulse delay-700" />

      <div className="relative flex flex-col items-center gap-8 max-w-xs text-center">
        {/* Logo Animation */}
        <div className="relative">
          <div className="size-20 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-primary/10 animate-float border border-border">
            <img src="/logo.png" alt="Loopback Logo" className="size-12 object-contain" />
          </div>
          {/* Pulsing Ring */}
          <div className="absolute -inset-4 rounded-3xl border-2 border-primary/20 animate-ping opacity-20" />
        </div>

        {/* Text and Progress */}
        <div className="space-y-4 w-full">
          <div className="space-y-1">
            <h2 className="font-serif-display text-2xl tracking-tight">Loopback</h2>
            <div className="h-6 overflow-hidden">
              <p 
                key={messageIndex}
                className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                {LOADING_MESSAGES[messageIndex]}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-primary/20" />
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent animate-shimmer-slide" />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-40 grayscale">
        <img src="/logo.png" alt="Logo" className="size-4 object-contain" />
        <span className="text-xs font-serif-display uppercase tracking-widest font-medium">Premium Feedback SaaS</span>
      </div>
    </div>
  );
}
