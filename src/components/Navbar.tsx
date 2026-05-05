import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, Sparkles, User, Menu, MessageSquare, LayoutDashboard, Shield, Users, BookUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NavLink } from "./NavLink";
import { SignOutButton } from "./SignOutButton";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { canModerate: isModerator, canPostAndVote } = useRole();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const initials = (user?.email ?? "U").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    let active = true;
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (active) setAvatarUrl(data?.avatar_url ?? null); });
    const channel = supabase.channel(`profile-${user.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setAvatarUrl((payload.new as { avatar_url: string | null }).avatar_url ?? null))
      .subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <img src="/logo.png" alt="Loopback Logo" className="size-7 object-contain" />
        <span className="font-serif-display text-lg">Loopback</span>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-base">
                  <Avatar className="size-8">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile"><User className="size-4 mr-2" /> Profile</Link>
                </DropdownMenuItem>
                {canPostAndVote && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/my-posts"><BookUp className="size-4 mr-2" /> My Posts</Link>
                  </DropdownMenuItem>
                )}
                <div className="mt-1 border-t pt-1">
                  <SignOutButton variant="ghost" className="w-full justify-start h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2 font-serif-display text-xl">
                      <img src="/logo.png" alt="Logo" className="size-6 object-contain" /> Loopback
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-3">
                    <NavLink to="/dashboard" icon={MessageSquare}>Feedback</NavLink>
                    {canPostAndVote && <NavLink to="/dashboard/my-posts" icon={BookUp}>My Posts</NavLink>}
                    <NavLink to="/dashboard/overview" icon={LayoutDashboard}>Overview</NavLink>
                    <NavLink to="/dashboard/profile" icon={User}>Profile</NavLink>
                    {isModerator && (
                      <>
                        <NavLink to="/dashboard/management" icon={Users}>Team</NavLink>
                        <NavLink to="/dashboard/admin" icon={Shield}>Moderation</NavLink>
                      </>
                    )}
                  </nav>
                  <div className="mt-auto p-3 border-t">
                    <SignOutButton variant="sidebar" className="w-full" />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        ) : (
          <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
        )}
      </div>
    </header>
  );
}
