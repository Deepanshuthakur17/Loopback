import { LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface Props {
  variant?: "default" | "ghost" | "sidebar";
  className?: string;
}

export function SignOutButton({ variant = "default", className }: Props) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {variant === "sidebar" ? (
          <button className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-base",
            "text-red-500/80 hover:text-red-500 hover:bg-red-500/10",
            className
          )}>
            <LogOut className="size-4" />
            Sign out
          </button>
        ) : (
          <Button variant={variant === "ghost" ? "ghost" : "default"} className={cn("gap-2", className)}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will need to sign in again to post feedback or vote on existing ideas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
