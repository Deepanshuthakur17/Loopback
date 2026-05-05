import { NavLink } from "react-router-dom";
import { LayoutDashboard, MessageSquare, Sparkles, User, Shield, Users, BookUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";
import { SignOutButton } from "./SignOutButton";

const baseItems = [
  { to: "/dashboard", label: "Feedback", icon: MessageSquare },
  { to: "/dashboard/my-posts", label: "My Posts", icon: BookUp },
  { to: "/dashboard/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/profile", label: "Profile", icon: User },
];

export function AppSidebar() {
  const { canModerate, canPostAndVote } = useRole();
  
  const filteredBaseItems = canPostAndVote 
    ? baseItems 
    : baseItems.filter(item => item.to !== "/dashboard/my-posts");

  const items = canModerate
    ? [
      ...filteredBaseItems,
      { to: "/dashboard/management", label: "Team", icon: Users },
      { to: "/dashboard/admin", label: "Moderation", icon: Shield }
    ]
    : filteredBaseItems;
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4">
      <div className="flex items-center gap-2 px-2 py-2 mb-6">
        <img src="/logo.png" alt="Loopback Logo" className="size-8 object-contain" />
        <span className="font-serif-display text-xl text-sidebar-foreground">Loopback</span>
      </div>

      <nav className="space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <SignOutButton variant="sidebar" />

        <div className="px-3 py-3 rounded-lg bg-sidebar-accent/60 border border-sidebar-border">
          <p className="text-xs font-medium text-sidebar-foreground">Pro tip</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Sort by <span className="font-medium text-sidebar-foreground">Most voted</span> to spot what users want next.
          </p>
        </div>
      </div>
    </aside>
  );
}
