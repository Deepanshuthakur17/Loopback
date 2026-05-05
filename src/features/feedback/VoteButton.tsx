import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  count: number;
  voted: boolean;
  userVoteType: 1 | -1 | null;
  onToggle: (type: 1 | -1) => Promise<void> | void;
  disabled?: boolean;
}

export function VoteButton({ count, voted, userVoteType, onToggle, disabled }: VoteButtonProps) {
  const [bump, setBump] = useState(0);

  const handleVote = async (type: 1 | -1) => {
    if (disabled) return;
    setBump(b => b + 1);
    await onToggle(type);
  };

  return (
    <div className={cn(
      "flex flex-col items-center gap-1 min-w-[40px] px-1 py-1 rounded-lg border bg-card",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={disabled}
        aria-pressed={userVoteType === 1}
        className={cn(
          "size-7 rounded flex items-center justify-center transition-base",
          userVoteType === 1
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <ChevronUp className={cn("size-4", userVoteType === 1 && "animate-vote-pop")} strokeWidth={3} />
      </button>
      
      <span className={cn(
        "text-sm font-bold tabular-nums leading-none",
        userVoteType === 1 ? "text-primary" : userVoteType === -1 ? "text-red-500" : "text-foreground"
      )}>
        {count}
      </span>

      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={disabled}
        aria-pressed={userVoteType === -1}
        className={cn(
          "size-7 rounded flex items-center justify-center transition-base",
          userVoteType === -1
            ? "bg-red-500/10 text-red-500"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
      >
        <ChevronUp className={cn("size-4 rotate-180", userVoteType === -1 && "animate-vote-pop")} strokeWidth={3} />
      </button>
    </div>
  );
}
