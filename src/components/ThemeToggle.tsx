import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" className="size-9" />;
  }

  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="size-9 transition-base hover:bg-secondary group"
    >
      <div className="relative size-4 flex items-center justify-center">
        <Sun className={`size-4 transition-all duration-300 ${isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`} />
        <Moon className={`absolute size-4 transition-all duration-300 group-hover:text-white ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`} />
      </div>
    </Button>
  );
}
