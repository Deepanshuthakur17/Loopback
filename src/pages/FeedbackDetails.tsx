import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFeedback, toggleVote, invalidateAllFeedback, useComments, createComment, updateComment, deleteComment } from "@/features/feedback/api";
import { useRole } from "@/hooks/useRole";
import { 
  ArrowLeft, MessageSquare, Clock, User as UserIcon, 
  Crown, ShieldCheck, UserCheck, User, 
  Edit2, Trash2, X, Check, MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/features/feedback/CategoryBadge";
import { VoteButton } from "@/features/feedback/VoteButton";
import { FeedbackSkeleton } from "@/features/feedback/FeedbackSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InteractiveAvatar } from "@/components/InteractiveAvatar";
import { toast } from "sonner";

const RoleIcon = ({ role, className }: { role: string; className?: string }) => {
  switch (role.toLowerCase()) {
    case 'admin': return <Crown className={cn("size-3 text-amber-500", className)} />;
    case 'manager': return <ShieldCheck className={cn("size-3 text-blue-500", className)} />;
    case 'member': return <UserCheck className={cn("size-3 text-green-500", className)} />;
    default: return <User className={cn("size-3 text-indigo-500", className)} />;
  }
};

export default function FeedbackDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const { data, isLoading } = useFeedback({
    id,
    userId: user?.id ?? null,
    category: "All",
    search: "",
    sort: "latest"
  });
  const item = data?.[0];

  const handleVote = async (type: 1 | -1) => {
    if (!user || !item) return;
    try {
      await toggleVote(item.id, user.id, item.has_voted, type);
      await invalidateAllFeedback();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vote failed";
      if (msg.includes("own post")) {
        toast.warning(msg);
      } else {
        toast.error(msg);
      }
    }
  };

  if (isLoading) return <div className="p-6"><FeedbackSkeleton /></div>;
  if (!item) return (
    <div className="flex flex-col items-center justify-center py-20">
      <p className="text-muted-foreground mb-4">Post not found</p>
      <Button onClick={() => navigate("/dashboard")}>Go back</Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={handleBack} className="-ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 mr-2" /> Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        <div className="flex flex-col items-center">
          <VoteButton
            count={item.vote_count}
            voted={item.has_voted}
            userVoteType={item.user_vote_type}
            onToggle={handleVote}
            disabled={!user || item.user_id === user.id}
          />
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CategoryBadge category={item.category} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> {formatDistanceToNow(new Date(item.created_at))} ago
              </span>
            </div>
            <h1 className="font-serif-display text-3xl md:text-5xl tracking-tight">{item.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <InteractiveAvatar 
                src={item.author_avatar} 
                name={item.author_name ?? "User"} 
                className="size-8 border-2 border-background shadow-soft"
                fallbackClassName="bg-gradient-brand text-white text-[10px] font-bold"
              />
              <div className="flex items-center gap-1">
                <span>Posted by</span>
                <div className="flex gap-1 items-center">
                  <span className="font-medium text-foreground ml-1">{item.author_email || item.author_name || "Someone"}</span>
                  {(item.author_roles || []).map(role => <RoleIcon key={role} role={role} />)}
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {item.description}
            </p>
          </div>

          {item.image_url && (
            <div className="rounded-2xl overflow-hidden border bg-muted shadow-lg">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-auto object-contain max-h-[800px]"
              />
            </div>
          )}

          <hr className="border-border" />

          <CommentsSection feedbackId={item.id} />
        </div>
      </div>
    </div>
  );
}

function CommentsSection({ feedbackId }: { feedbackId: string }) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { data: comments, isLoading, mutate } = useComments(feedbackId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(feedbackId, user.id, newComment.trim());
      setNewComment("");
      mutate();
      toast.success("Comment posted");
    } catch (e) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-serif-display text-2xl flex items-center gap-2">
        <MessageSquare className="size-5 text-primary" /> Comments
        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold">
          {comments?.length ?? 0}
        </span>
      </h3>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-3 bg-card/50 p-4 rounded-xl border border-border shadow-soft">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none min-h-[80px] outline-none"
          />
          <div className="flex justify-end pt-2 border-t border-border/50">
            <Button type="submit" size="sm" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground italic">Loading comments...</p>
        ) : comments?.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No comments yet. Be the first!</p>
        ) : (
          comments?.map((comment: any) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              currentUser={user}
              isAdmin={isAdmin}
              onUpdate={() => mutate()} 
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUser, isAdmin, onUpdate }: { comment: any; currentUser: any; isAdmin: boolean; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const isOwner = currentUser?.id === comment.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateComment(comment.id, editContent.trim());
      setIsEditing(false);
      onUpdate();
      toast.success("Comment updated");
    } catch (e) {
      toast.error("Failed to update comment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComment(comment.id);
      onUpdate();
      toast.success("Comment deleted");
    } catch (e) {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-border bg-card/50 transition-base hover:bg-card/80">
      <InteractiveAvatar 
        src={comment.author.avatar} 
        name={comment.author.name} 
        className="size-8 border-2 border-background shrink-0"
        fallbackClassName="bg-secondary text-secondary-foreground text-[10px] font-bold"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{comment.author.name}</span>
          <div className="flex gap-1 items-center">
            {comment.author.roles.map((role: string) => (
              <span key={role} className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground border border-border/50">
                {role}
                <RoleIcon role={role} />
              </span>
            ))}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at))} ago
            </span>
            {(isOwner || isAdmin) && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-floating">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="size-3.5 mr-2" /> Edit
                    </DropdownMenuItem>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="size-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="shadow-floating animate-scale-in">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete comment?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove your comment from this post.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-3 mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-background border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                <X className="size-3.5 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? "Saving..." : <><Check className="size-3.5 mr-1" /> Save</>}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}
