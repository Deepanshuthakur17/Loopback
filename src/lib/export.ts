import type { FeedbackItem } from "@/features/feedback/api";

export type ExportColumn =
  | "title" | "description" | "category" | "votes"
  | "author" | "pinned" | "hidden" | "pin_reason" | "hide_reason" | "created";

export const ALL_COLUMNS: { key: ExportColumn; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "votes", label: "Votes" },
  { key: "author", label: "Author" },
  { key: "pinned", label: "Pinned" },
  { key: "hidden", label: "Hidden" },
  { key: "pin_reason", label: "Pin reason" },
  { key: "hide_reason", label: "Hide reason" },
  { key: "created", label: "Created" },
];

export interface ExportOptions {
  columns: ExportColumn[];
  includeHidden?: boolean;
  includePinned?: boolean;
}

export const DEFAULT_COLUMNS: ExportColumn[] =
  ["title", "description", "category", "votes", "author", "created"];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(v: unknown): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cellValue(i: FeedbackItem, key: ExportColumn): string {
  switch (key) {
    case "title": return i.title;
    case "description": return i.description;
    case "category": return i.category;
    case "votes": return String(i.vote_count);
    case "author": return i.author_name ?? "";
    case "pinned": return i.is_pinned ? "yes" : "";
    case "hidden": return i.is_hidden ? "yes" : "";
    case "pin_reason": return i.pin_reason ?? "";
    case "hide_reason": return i.hide_reason ?? "";
    case "created": return new Date(i.created_at).toISOString();
  }
}

function applyFilters(items: FeedbackItem[], opts: ExportOptions): FeedbackItem[] {
  return items.filter((i) => {
    if (i.is_hidden && !opts.includeHidden) return false;
    if (i.is_pinned && opts.includePinned === false) return false;
    return true;
  });
}

export function exportFeedbackCSV(items: FeedbackItem[], opts: ExportOptions, filename = "feedback.csv") {
  const rows = applyFilters(items, opts);
  const cols = opts.columns.length ? opts.columns : DEFAULT_COLUMNS;
  const headers = cols.map((c) => ALL_COLUMNS.find((x) => x.key === c)?.label ?? c);
  const csv = [headers, ...rows.map((r) => cols.map((c) => cellValue(r, c)))]
    .map((r) => r.map(escapeCsv).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export async function exportFeedbackPDF(items: FeedbackItem[], opts: ExportOptions, filename = "feedback.pdf") {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  const rows = applyFilters(items, opts);
  const cols = opts.columns.length ? opts.columns : DEFAULT_COLUMNS;

  doc.setFontSize(18);
  doc.text("Loopback — Feedback Export", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} items`, 14, 25);

  const totalVotes = rows.reduce((s, i) => s + i.vote_count, 0);
  const byCat = rows.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1;
    return acc;
  }, {});
  doc.setTextColor(40);
  const stats = `Total votes: ${totalVotes}   ·   ${Object.entries(byCat)
    .map(([c, n]) => `${c}: ${n}`)
    .join("   ·   ")}`;
  doc.text(stats, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [cols.map((c) => ALL_COLUMNS.find((x) => x.key === c)?.label ?? c)],
    body: rows.map((r) => cols.map((c) => cellValue(r, c))),
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [30, 30, 30] },
  });

  doc.save(filename);
}
