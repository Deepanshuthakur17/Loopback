import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFeedback, CATEGORIES } from "@/features/feedback/api";
import { CategoryBadge } from "@/features/feedback/CategoryBadge";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Overview() {
  const { user } = useAuth();
  const { data } = useFeedback({ userId: user?.id ?? null, category: "All", search: "", sort: "latest" });

  const stats = useMemo(() => {
    const items = data ?? [];
    const totalVotes = items.reduce((sum, i) => sum + i.vote_count, 0);
    const byCat = CATEGORIES.map(c => ({
      category: c,
      count: items.filter(i => i.category === c).length,
    }));
    const top = [...items].sort((a, b) => b.vote_count - a.vote_count).slice(0, 5);
    return { total: items.length, totalVotes, byCat, top };
  }, [data]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">A snapshot of what your users are asking for.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total feedback" value={stats.total} />
        <Stat label="Total votes" value={stats.totalVotes} suffix="votes" />
        <Stat label="Avg votes / idea" value={stats.total ? (stats.totalVotes / stats.total).toFixed(1) : "0"} suffix="votes" />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">By category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.byCat.map(c => (
            <div key={c.category} className="p-5 rounded-xl border border-border bg-card">
              <CategoryBadge category={c.category} />
              <p className="font-serif-display text-3xl mt-3">{c.count}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top voted</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {stats.top.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No feedback yet.</p>
          )}
          {stats.top.map((item, i) => (
            <div key={item.id} className={`flex items-center gap-4 p-4 ${i !== 0 ? "border-t border-border" : ""}`}>
              <span className="font-serif-display text-2xl text-muted-foreground w-8 text-center">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge category={item.category} />
                </div>
              </div>
              <span className={cn(
                "font-semibold tabular-nums flex items-baseline gap-1",
                item.vote_count >= 0 ? "text-foreground" : "text-red-500"
              )}>
                {item.vote_count >= 0 ? (
                  <ArrowUpIcon className="size-3 text-primary" />
                ) : (
                  <ArrowDownIcon className="size-3 text-red-500" />
                )}
                {item.vote_count}
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">votes</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </div >
  );
}

function Stat({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-card hover:shadow-soft transition-base">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="font-serif-display text-4xl">{value}</p>
        {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
