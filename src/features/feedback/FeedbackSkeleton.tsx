export function FeedbackSkeleton() {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="w-[58px] h-14 rounded-lg bg-muted animate-pulse" />
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-full rounded bg-muted animate-pulse" />
        <div className="h-3 w-5/6 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}
