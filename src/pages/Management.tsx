import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  Plus,
  Search
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface UserWorkStats {
  id: string;
  display_name: string;
  role: string;
  posts_count: number;
  comments_count: number;
}

export default function Management() {
  const { user } = useAuth();
  const { canModerate } = useRole();
  const [stats, setStats] = useState<UserWorkStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (canModerate) fetchStats();
  }, [canModerate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      // Fetch all profiles and join with posts/comments counts
      // In a real app, you'd use a RPC or complex join, but for demo we fetch and aggregate
      const { data: profiles } = await supabase.from("profiles").select("id, display_name");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const { data: feedback } = await supabase.from("feedback").select("user_id");
      const { data: comments } = await supabase.from("comments").select("user_id");

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));
      
      const computedStats = profiles?.map(p => ({
        id: p.id,
        display_name: p.display_name || "Anonymous",
        role: roleMap.get(p.id) || "user",
        posts_count: feedback?.filter(f => f.user_id === p.id).length || 0,
        comments_count: comments?.filter(c => c.user_id === p.id).length || 0
      })) || [];

      setStats(computedStats);
    } catch (e) {
      toast.error("Failed to fetch team stats");
    } finally {
      setLoading(false);
    }
  };

  if (!canModerate) {
    return <div className="p-20 text-center">You do not have permission to access this page.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif-display text-4xl tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">Monitor work progress and manage projects.</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Performance</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardDescription>Total Team Members</CardDescription>
                <CardTitle className="text-3xl font-serif-display">{stats.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-primary gap-1">
                  <TrendingUp className="size-3" /> Active this month
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Works Done (Day)</CardDescription>
                <CardTitle className="text-3xl font-serif-display">
                  {stats.reduce((acc, s) => acc + s.posts_count + s.comments_count, 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs text-muted-foreground gap-1">
                  <CheckCircle2 className="size-3" /> Combined tasks
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Member Productivity</CardTitle>
              <CardDescription>Track posts and comments across your team.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading team data...</div>
                ) : stats.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                        {s.display_name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{s.display_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{s.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-8 text-center">
                      <div>
                        <p className="text-xl font-bold">{s.posts_count}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Posts</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{s.comments_count}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Comments</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Search projects..." className="pl-9" />
            </div>
            <Button>
              <Plus className="size-4 mr-2" /> Create Project
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-dashed border-2 flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Briefcase className="size-10 mb-2 opacity-20" />
              <p>No active projects found</p>
              <Button variant="link" className="text-primary mt-2">Start a new project</Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
