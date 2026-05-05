import { useState } from "react";
import { Download, FileText } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ALL_COLUMNS, DEFAULT_COLUMNS, exportFeedbackCSV, exportFeedbackPDF,
  type ExportColumn,
} from "@/lib/export";
import type { FeedbackItem } from "@/features/feedback/api";

interface Props {
  items: FeedbackItem[];
  filename?: string;
  triggerLabel?: string;
  /** When true, default-include hidden items (admin views). */
  adminMode?: boolean;
}

export function ExportDialog({ items, filename = "feedback", triggerLabel = "Export", adminMode }: Props) {
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS);
  const [includeHidden, setIncludeHidden] = useState(!!adminMode);
  const [includePinned, setIncludePinned] = useState(true);

  const toggle = (key: ExportColumn) =>
    setColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const run = async (kind: "csv" | "pdf") => {
    if (!items.length) return toast.error("Nothing to export");
    if (!columns.length) return toast.error("Pick at least one column");
    try {
      const opts = { columns, includeHidden, includePinned };
      if (kind === "csv") exportFeedbackCSV(items, opts, `${filename}.csv`);
      else await exportFeedbackPDF(items, opts, `${filename}.pdf`);
      toast.success(`Exported as ${kind.toUpperCase()}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          <Download className="size-4 mr-1.5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-2xl">Export feedback</DialogTitle>
          <DialogDescription>Pick the columns and filters for your export.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Columns</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_COLUMNS.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={columns.includes(c.key)} onCheckedChange={() => toggle(c.key)} />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Filters</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={includeHidden} onCheckedChange={(v) => setIncludeHidden(!!v)} />
                <span>Include hidden items</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={includePinned} onCheckedChange={(v) => setIncludePinned(!!v)} />
                <span>Include pinned items</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => run("csv")}>
            <FileText className="size-4 mr-1.5" /> CSV
          </Button>
          <Button onClick={() => run("pdf")}>
            <FileText className="size-4 mr-1.5" /> PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
