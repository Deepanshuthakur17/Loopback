import { cn } from "@/lib/utils";
import type { Category } from "./api";

const STYLES: Record<Category, string> = {
  Bug: "bg-destructive/10 text-destructive border-destructive/20",
  Feature: "bg-success/10 text-success border-success/20",
  Improvement: "bg-info/10 text-info border-info/20",
};

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium tracking-tight",
        STYLES[category],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {category}
    </span>
  );
}
