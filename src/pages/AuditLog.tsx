import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ScrollText, Pin, EyeOff, Eye, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  feedback_id: string | null;
  feedback_title: string | null;
  reason: string | null;
  created_at: string;
}

const ICONS: Record<string, typeof Pin> = {
  pin: Pin, unpin: Pin, hide: EyeOff, unhide: Eye, delete: Trash2,
};

export default function AuditLog() {
  const { user, loading: authLoading } = useAuth();
  const { canModerate, loading: roleLoading } = useRole();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [admins, setAdmins] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("admin_audit_log")
      .select("id,admin_id,action,feedback_id,feedback_title,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(async ({ data }) => {
        const list = (data ?? []) as AuditEntry[];
        setEntries(list);
        const ids = Array.from(new Set(list.map((e) => e.admin_id)));
        if (ids.length) {
          const { data: profiles } = await supabase
            .from("profiles").select("id,display_name").in("id", ids);
          setAdmins(new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? p.id.slice(0, 8)])));
        }
        setLoading(false);
      });
  }, []);

  if (authLoading || roleLoading) return null;
  if (!canModerate) return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link to="/dashboard/admin"><ArrowLeft className="size-4 mr-1.5" /> Back to moderation</Link>
        </Button>
        <h1 className="font-serif-display text-4xl md:text-5xl tracking-tight flex items-center gap-3">
          <ScrollText className="size-8 text-primary" /> Audit log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last {entries.length} moderation actions across the workspace.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading audit log…</div>
      ) : entries.length === 0 ? (
        <div className="p-10 text-center rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          No moderation activity yet.
        </div>
      ) : (
        <ol className="space-y-2">
          {entries.map((e) => {
            const Icon = ICONS[e.action] ?? ScrollText;
            const destructive = e.action === "delete";
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border bg-card hover:shadow-soft transition-base",
                  destructive ? "border-destructive/30" : "border-border"
                )}
              >
                <div className={cn(
                  "size-8 shrink-0 rounded-lg flex items-center justify-center",
                  destructive ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground"
                )}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{admins.get(e.admin_id) ?? "Staff"}</span>{" "}
                    <span className="text-muted-foreground">{e.action}d</span>{" "}
                    <span className="font-medium">{e.feedback_title ?? "feedback"}</span>
                  </p>
                  {e.reason && <p className="text-xs text-muted-foreground mt-1">"{e.reason}"</p>}
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })} · admin {e.admin_id.slice(0, 8)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
