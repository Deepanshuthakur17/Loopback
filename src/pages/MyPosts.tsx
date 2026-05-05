import { useMemo } from "react";
import { Inbox, BookUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useFeedback, toggleVote, invalidateAllFeedback, setFeedbackFlags, deleteFeedback, type FeedbackItem, feedbackKey } from "@/features/feedback/api";
import { FeedbackCard } from "@/features/feedback/FeedbackCard";
import { FeedbackSkeleton } from "@/features/feedback/FeedbackSkeleton";
import { mutate as swrMutate } from "swr";
import { toast } from "sonner";

export default function MyPosts() {
  const { user } = useAuth();
  const { isAdmin, canModerate: isModerator, canPostAndVote } = useRole();

  const args = useMemo(
    () => ({ userId: user?.id ?? null, category: "All" as const, search: "", sort: "latest" as const, authorId: user?.id }),
    [user?.id]
  );
  const { data, isLoading, error } = useFeedback(args);

  const handleDelete = async (i: FeedbackItem, reason?: string) => {
    try {
      await deleteFeedback(i.id, user ? { adminId: user.id, title: i.title, reason } : undefined);
      toast.success("Deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handleVote = async (id: string, currentlyVoted: boolean, type: 1 | -1, userVoteType: 1 | -1 | null) => {
    if (!user) return;
    const key = feedbackKey(args);
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
              newVoteCount -= type;
              newUserVoteType = null;
              newHasVoted = false;
            } else {
              newVoteCount = f.vote_count - (userVoteType || 0) + type;
            }
          } else {
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
      toast.error(e instanceof Error ? e.message : "Vote failed");
      await invalidateAllFeedback();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight flex items-center gap-3">
          <BookUp className="size-8 text-primary" /> My Posts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          You have shared {data?.length ?? 0} {data?.length === 1 ? "idea" : "ideas"}.
        </p>
      </div>

      <div className="space-y-3">
        {error && (
          <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            Couldn't load your posts. {error instanceof Error ? error.message : ""}
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
            <h3 className="font-serif-display text-2xl mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              You haven't shared any feedback yet. Your ideas will appear here.
            </p>
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
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
