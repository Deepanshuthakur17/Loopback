import { useMemo, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Shield, Search, ScrollText, Users, MessageSquare, ShieldCheck, Crown, UserCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useRealtimeFeedback } from "@/hooks/useRealtimeFeedback";
import {
  useFeedback, setFeedbackFlags, deleteFeedback, updateUserRole, type FeedbackItem,
} from "@/features/feedback/api";
import { FeedbackCard } from "@/features/feedback/FeedbackCard";
import { FeedbackSkeleton } from "@/features/feedback/FeedbackSkeleton";
import { ExportDialog } from "@/components/ExportDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Admin() {
  useRealtimeFeedback();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, canModerate: isModerator, loading: roleLoading } = useRole();
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ item: FeedbackItem; reason: string } | null>(null);

  const args = useMemo(
    () => ({ userId: user?.id ?? null, category: "All" as const, search, sort: "latest" as const, includeHidden: true }),
    [user?.id, search]
  );
  const { data, isLoading } = useFeedback(args);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, email, avatar_url"),
        supabase.from("user_roles").select("user_id, role")
      ]);
      
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));
      const enriched = profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.id) || "user"
      })) || [];
      
      setUsers(enriched);
    } catch (e) {
      toast.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await updateUserRole(targetUserId, newRole);
      toast.success("Role updated successfully");
      fetchUsers();
    } catch (e) {
      toast.error("Failed to update role");
    }
  };

  if (authLoading || roleLoading) return null;
  if (!isModerator) return <Navigate to="/dashboard" replace />;

  const audit = (title: string, reason?: string) =>
    user ? { adminId: user.id, title, reason } : undefined;

  const togglePin = async (i: FeedbackItem, reason?: string) => {
    try {
      await setFeedbackFlags(
        i.id,
        { is_pinned: !i.is_pinned, pin_reason: !i.is_pinned ? (reason ?? null) : null },
        audit(i.title, reason),
      );
      toast.success(i.is_pinned ? "Unpinned" : "Pinned");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const toggleHide = async (i: FeedbackItem, reason?: string) => {
    try {
      await setFeedbackFlags(
        i.id,
        { is_hidden: !i.is_hidden, hide_reason: !i.is_hidden ? (reason ?? null) : null },
        audit(i.title, reason),
      );
      toast.success(i.is_hidden ? "Unhidden" : "Hidden");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFeedback(pendingDelete.item.id, audit(pendingDelete.item.title, pendingDelete.reason || undefined));
      toast.success("Feedback deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setPendingDelete(null);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.display_name?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight flex items-center gap-3">
            <Shield className="size-8 text-primary" /> Moderation
          </h1>
          <p className="text-muted-foreground mt-2">
            The command center for platform administrators and managers.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild variant="outline">
            <Link to="/dashboard/admin/audit"><ScrollText className="size-4 mr-1.5" /> Audit log</Link>
          </Button>
          <ExportDialog items={data ?? []} filename="moderation" adminMode />
        </div>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <MessageSquare className="size-4" /> Content
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="size-4" /> User Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6 mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all feedback…"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-card text-sm transition-base focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div className="space-y-4">
            {isLoading && !data && (<><FeedbackSkeleton /><FeedbackSkeleton /></>)}
            {data?.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onVote={async () => {}}
                disabled
                canModerate
                isAdmin={isAdmin}
                onTogglePin={togglePin}
                onToggleHide={toggleHide}
                onDelete={async (i, reason) => setPendingDelete({ item: i, reason: reason ?? "" })}
              />
            ))}
            {!isLoading && data?.length === 0 && (
              <div className="p-10 text-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
                No feedback to moderate.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          {!isAdmin ? (
            <div className="p-10 text-center rounded-xl border bg-muted/30 text-muted-foreground italic">
              User role management is restricted to Administrators only.
            </div>
          ) : (
            <>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users by email or name…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-input bg-card text-sm transition-base focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loadingUsers ? (
                  <div className="py-20 text-center text-muted-foreground italic">Loading users...</div>
                ) : filteredUsers.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card gap-4 hover:shadow-soft transition-base">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground">
                        {u.display_name?.[0] || u.email?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-semibold">{u.display_name || "No Name"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 mr-4">
                        {u.role === 'admin' && <Crown className="size-4 text-amber-500" />}
                        {u.role === 'manager' && <ShieldCheck className="size-4 text-blue-500" />}
                        {u.role === 'member' && <UserCheck className="size-4 text-green-500" />}
                        {u.role === 'user' && <User className="size-4 text-indigo-500" />}
                        <span className="text-xs font-bold uppercase tracking-wider">{u.role}</span>
                      </div>
                      
                      <select 
                        className="text-xs bg-muted border-none rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{pendingDelete?.item.title}" and all its votes. This action cannot be undone.
              {pendingDelete?.reason && <span className="block mt-2 text-xs">Reason: {pendingDelete.reason}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
