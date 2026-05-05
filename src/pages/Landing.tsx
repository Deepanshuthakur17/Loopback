import { Link, Navigate } from "react-router-dom";
import { ArrowRight, MessageSquare, BarChart3, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingScreen";

const features = [
  { icon: MessageSquare, title: "Collect feedback", body: "A clean, distraction-free space for your users to share what matters." },
  { icon: Vote, title: "Vote on what wins", body: "One vote per user, optimistic UI, and instant ranking by demand." },
  { icon: BarChart3, title: "Ship with clarity", body: "Sort, filter and tag — turn raw signal into a confident roadmap." },
];

export default function Landing() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-subtle">
      <header className="flex items-center justify-between px-6 md:px-10 h-16">
        <Link to="/" className="flex items-center gap-2 font-serif-display text-2xl tracking-tight">
          <img src="/logo.png" alt="Loopback Logo" className="size-8 object-contain" />
          Loopback
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          <Button asChild size="sm"><Link to="/auth?mode=signup">Get started</Link></Button>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-3xl text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-success" /> Now with realtime voting
          </span>
          <h1 className="font-serif-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-6">
            Feedback that<br />
            <span className="italic text-muted-foreground">actually ships.</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            A premium feedback tool for product teams who care about clarity. Capture ideas, prioritize with votes, and turn signal into your next release.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg" className="group">
              <Link to="/auth?mode=signup">
                Start collecting <ArrowRight className="size-4 ml-1 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg"><Link to="/auth">I have an account</Link></Button>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-20 max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-2xl border border-border bg-card shadow-soft hover:shadow-elegant transition-base">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="size-5" />
              </div>
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built with care · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
