import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Pin, EyeOff, Eye, Trash2, Edit2, Crown, ShieldCheck, UserCheck, User, CalendarDays, ImageIcon } from "lucide-react";
import { VoteButton } from "./VoteButton";
import { CategoryBadge } from "./CategoryBadge";
import type { FeedbackItem } from "./api";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeedbackForm } from "./FeedbackForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InteractiveAvatar } from "@/components/InteractiveAvatar";
import { cn } from "@/lib/utils";

interface Props {
  item: FeedbackItem;
  onVote: (item: FeedbackItem, type: 1 | -1) => void;
  disabled?: boolean;
  canVote?: boolean;
  canModerate?: boolean;
  isAdmin?: boolean;
  onTogglePin?: (item: FeedbackItem, reason?: string) => Promise<void>;
  onToggleHide?: (item: FeedbackItem, reason?: string) => Promise<void>;
  onDelete?: (item: FeedbackItem, reason?: string) => Promise<void>;
}

function ReasonBadge({
  icon: Icon, label, reason, tone,
}: { icon: typeof Pin; label: string; reason: string | null; tone: "primary" | "muted" }) {
  const className = cn(
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium cursor-default",
    tone === "primary"
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-muted-foreground/30 bg-muted text-muted-foreground"
  );
  const badge = (
    <span className={className}>
      <Icon className="size-3" /> {label}
      {reason && <span className="opacity-70">· why?</span>}
    </span>
  );
  if (!reason) return badge;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs font-semibold mb-0.5">{label} reason</p>
          <p className="text-xs">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const RoleIcon = ({ role, className }: { role: string; className?: string }) => {
  switch (role.toLowerCase()) {
    case 'admin': return <Crown className={cn("size-3 text-amber-500", className)} />;
    case 'manager': return <ShieldCheck className={cn("size-3 text-blue-500", className)} />;
    case 'member': return <UserCheck className={cn("size-3 text-green-500", className)} />;
    default: return <User className={cn("size-3 text-muted-foreground", className)} />;
  }
};

export function FeedbackCard({
  item, onVote, disabled, canVote, canModerate, isAdmin, onTogglePin, onToggleHide, onDelete,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = user?.id === item.user_id;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons/menus
    if ((e.target as HTMLElement).closest('button, a, [role="menuitem"]')) return;
    navigate(`/dashboard/feedback/${item.id}`);
  };

  const ask = (q: string) => {
    const r = window.prompt(q, "");
    return r === null ? undefined : r.trim();
  };
  return (
    <>
      <article 
        onClick={handleCardClick}
        className={cn(
        "group flex items-start gap-4 p-5 rounded-xl border bg-card hover:bg-gradient-subtle hover:shadow-soft transition-base animate-fade-in cursor-pointer",
        item.is_pinned ? "border-primary/40" : "border-border hover:border-border/80",
        item.is_hidden && "opacity-60"
      )}>
        <VoteButton
          count={item.vote_count}
          voted={item.has_voted}
          userVoteType={item.user_vote_type}
          onToggle={(type) => onVote(item, type)}
          disabled={disabled || !canVote || isOwner}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <CategoryBadge category={item.category} />
            {item.is_pinned && <ReasonBadge icon={Pin} label="Pinned" reason={item.pin_reason} tone="primary" />}
            {item.is_hidden && <ReasonBadge icon={EyeOff} label="Hidden" reason={item.hide_reason} tone="muted" />}
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 flex-wrap">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <span className="cursor-help hover:text-foreground hover:underline underline-offset-2 transition-colors font-medium inline-flex items-center gap-1">
                    {item.author_email ?? item.author_name ?? "Someone"}
                    {(item.author_roles || []).map(role => <RoleIcon key={role} role={role} />)}
                  </span>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 shadow-floating animate-scale-in">
                  <div className="flex justify-between space-x-4">
                    <InteractiveAvatar 
                      src={item.author_avatar} 
                      name={item.author_name ?? "User"} 
                      className="size-12 border-2 border-background shadow-soft"
                      fallbackClassName="bg-gradient-brand text-white font-serif-display text-lg"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{item.author_name ?? "Anonymous User"}</h4>
                        <div className="flex gap-1">
                          {(item.author_roles || []).map(role => (
                            <div key={role} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-bold uppercase">
                              <RoleIcon role={role} />
                              {role}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-primary" />
                        {item.author_email ?? "No email provided"}
                      </p>
                      <div className="flex items-center pt-2">
                        <CalendarDays className="mr-2 h-3.5 w-3.5 opacity-70" />{" "}
                        <span className="text-xs text-muted-foreground">
                          Post shared {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              {" · "}
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              {item.image_url && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 ml-1">
                  <ImageIcon className="size-3" /> Click on post for Image
                </span>
              )}
            </span>
          </div>
          <h3 className="font-semibold text-foreground leading-snug mb-1">{item.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">{item.description}</p>

        </div>

        {(canModerate || isOwner) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Actions"
                className="size-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-base"
              >
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-floating animate-scale-in">
              {isOwner && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="size-4 mr-2" /> Edit post
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="size-4 mr-2" /> Delete post
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="shadow-floating animate-scale-in">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove "{item.title}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete?.(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {canModerate && isOwner && <DropdownMenuSeparator />}

              {canModerate && (
                <>
                  <DropdownMenuItem
                    onClick={() => onTogglePin?.(item, item.is_pinned ? undefined : ask("Reason for pinning (optional):"))}
                  >
                    <Pin className="size-4 mr-2" /> {item.is_pinned ? "Unpin" : "Pin to top"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onToggleHide?.(item, item.is_hidden ? undefined : ask("Reason for hiding (optional):"))}
                  >
                    {item.is_hidden ? <><Eye className="size-4 mr-2" /> Unhide</> : <><EyeOff className="size-4 mr-2" /> Hide</>}
                  </DropdownMenuItem>
                </>
              )}

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                        <Trash2 className="size-4 mr-2" /> Admin Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="shadow-floating animate-scale-in">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Admin Delete: {item.title}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          As an Admin, you are permanently removing this feedback.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete?.(item)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </article>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-xl">Edit feedback</DialogTitle>
            <DialogDescription>Update your idea and details.</DialogDescription>
          </DialogHeader>
          {user && (
            <FeedbackForm
              userId={user.id}
              initialItem={item}
              onSuccess={() => setIsEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
