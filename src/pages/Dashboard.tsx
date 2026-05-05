import { useMemo, useState } from "react";
import { Plus, Search, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useRealtimeFeedback } from "@/hooks/useRealtimeFeedback";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  useFeedback, toggleVote, invalidateAllFeedback, setFeedbackFlags, deleteFeedback,
  CATEGORIES, type Category, type SortKey, type FeedbackItem, feedbackKey,
} from "@/features/feedback/api";
import { FeedbackCard } from "@/features/feedback/FeedbackCard";
import { FeedbackForm } from "@/features/feedback/FeedbackForm";
import { FeedbackSkeleton } from "@/features/feedback/FeedbackSkeleton";
import { ExportDialog } from "@/components/ExportDialog";
import { cn } from "@/lib/utils";
import { mutate as swrMutate } from "swr";
import { toast } from "sonner";

const TABS: Array<Category | "All"> = ["All", ...CATEGORIES];
const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "votes", label: "Most voted" },
  { key: "latest", label: "Latest" },
];

export default function Dashboard() {
  useRealtimeFeedback();
  const { user } = useAuth();
  const { isAdmin, canModerate: isModerator, canPostAndVote } = useRole();
  const [category, setCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("votes");
  const [open, setOpen] = useState(false);

  const args = useMemo(
    () => ({ userId: user?.id ?? null, category, search, sort }),
    [user?.id, category, search, sort]
  );
  const { data, isLoading, error } = useFeedback(args);

  const handleTogglePin = async (i: FeedbackItem, reason?: string) => {
    try {
      await setFeedbackFlags(
        i.id,
        { is_pinned: !i.is_pinned, pin_reason: !i.is_pinned ? (reason ?? null) : null },
        user ? { adminId: user.id, title: i.title, reason } : undefined,
      );
      toast.success(i.is_pinned ? "Unpinned" : "Pinned");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const handleToggleHide = async (i: FeedbackItem, reason?: string) => {
    try {
      await setFeedbackFlags(
        i.id,
        { is_hidden: !i.is_hidden, hide_reason: !i.is_hidden ? (reason ?? null) : null },
        user ? { adminId: user.id, title: i.title, reason } : undefined,
      );
      toast.success(i.is_hidden ? "Unhidden" : "Hidden");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const handleDelete = async (i: FeedbackItem, reason?: string) => {
    try {
      await deleteFeedback(i.id, user ? { adminId: user.id, title: i.title, reason } : undefined);
      toast.success("Deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handleVote = async (id: string, currentlyVoted: boolean, type: 1 | -1, userVoteType: 1 | -1 | null) => {
    if (!user) return;
    const key = feedbackKey(args);
    
    // Optimistic update
    await swrMutate(
      key,
      (current: typeof data) =>
        current?.map(f => {
          if (f.id !== id) return f;
          
          let newVoteCount = f.vote_count;
          let newUserVoteType: 1 | -1 | null = type;
          let newHasVoted = true;

          if (currentlyVoted) {
            if (userVoteType === type) {
              // Unvoting
              newVoteCount -= type;
              newUserVoteType = null;
              newHasVoted = false;
            } else {
              // Changing vote type (e.g. up to down)
              // Remove old vote count and add new one
              newVoteCount = f.vote_count - (userVoteType || 0) + type;
            }
          } else {
            // New vote
            newVoteCount += type;
          }

          return { ...f, has_voted: newHasVoted, user_vote_type: newUserVoteType, vote_count: newVoteCount };
        }),
      { revalidate: false }
    );
    try {
      await toggleVote(id, user.id, currentlyVoted, type);
      await invalidateAllFeedback();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vote failed";
      if (msg.includes("own post")) {
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
      await invalidateAllFeedback();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight">Feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.length ?? 0} {data?.length === 1 ? "idea" : "ideas"} from your community.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ExportDialog items={data ?? []} filename="feedback" />


          {user && canPostAndVote && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" id="new-feedback-btn">
                  <Plus className="size-4 mr-1.5" /> New feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-serif-display text-xl">Share your idea</DialogTitle>
                  <DialogDescription>What would make the product better?</DialogDescription>
                </DialogHeader>
                {user && <FeedbackForm userId={user.id} onSuccess={() => setOpen(false)} />}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feedback…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-card text-sm transition-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-input bg-card p-0.5">
            {SORTS.map(s => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-base",
                  sort === s.key ? "bg-secondary text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setCategory(t)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-base",
              category === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {error && (
          <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            Couldn't load feedback. {error instanceof Error ? error.message : ""}
          </div>
        )}

        {isLoading && !data && (
          <>
            <FeedbackSkeleton /><FeedbackSkeleton /><FeedbackSkeleton />
          </>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-2xl border border-dashed border-border bg-card">
            <div className="size-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Inbox className="size-5 text-muted-foreground" />
            </div>
            <h3 className="font-serif-display text-2xl mb-1">No feedback yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              {search || category !== "All"
                ? "Try a different search or category to find what you're looking for."
                : "Be the first to share what would make this product better."}
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4 mr-1.5" /> Post the first idea
            </Button>
          </div>
        )}

        {data?.map(item => (
          <FeedbackCard
            key={item.id}
            item={item}
            onVote={(item, type) => handleVote(item.id, item.has_voted, type, item.user_vote_type)}
            disabled={!user}
            canVote={canPostAndVote}
            canModerate={isModerator}
            isAdmin={isAdmin}
            onTogglePin={handleTogglePin}
            onToggleHide={handleToggleHide}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
