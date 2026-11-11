/**
 * Report options chosen at the point of generating a PDF.
 *
 * Kept separate from the PDF layout (which pulls in the large PDF engine) so
 * the options screen can use the same filtering and grouping to show an exact
 * "N snags will be included" count before anything is generated.
 */
import { SNAG_STATUS_LABEL, type Snag, type SnagStatus } from "@/types/models";

export type ReportDesign = "table" | "photos" | "checklist";
export type StatusFilter = "all" | "outstanding" | "resolved";
export type GroupBy = "none" | "assigned_to" | "status" | "level";

export type ReportOptions = {
  design: ReportDesign;
  status: StatusFilter;
  /** Only include snags assigned to these names. Empty = everyone. */
  assignees: string[];
  groupBy: GroupBy;
  /** Add a page per level showing its drawing with the snags pinned on it. */
  includePlans: boolean;
  preparedBy: string;
  preparedFor: string;
};

export const DEFAULT_REPORT_OPTIONS: ReportOptions = {
  design: "table",
  status: "all",
  assignees: [],
  groupBy: "none",
  includePlans: true,
  preparedBy: "",
  preparedFor: "",
};

export const DESIGNS: { value: ReportDesign; label: string; description: string }[] = [
  { value: "table", label: "Standard table", description: "Every snag in one table with a small photo." },
  { value: "photos", label: "Photo report", description: "A large photo per snag. Best for clients." },
  { value: "checklist", label: "Checklist", description: "No photos, with tick boxes. Best for trades on site." },
];

export const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outstanding", label: "Outstanding" },
  { value: "resolved", label: "Resolved" },
];

export const GROUP_BY_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "assigned_to", label: "By trade" },
  { value: "level", label: "By level" },
  { value: "status", label: "By status" },
];

/** Label used for snags that aren't on a level. */
export const NO_LEVEL = "No level";

/** Label used for snags with no "assigned to". */
export const UNASSIGNED = "Unassigned";

const STATUS_ORDER: SnagStatus[] = ["open", "in_progress", "resolved"];

/** Distinct "assigned to" values in a snag list, alphabetical, with Unassigned last. */
export function listAssignees(snags: Pick<Snag, "assigned_to">[]): string[] {
  const names = new Map<string, string>(); // lower-case key → first spelling seen
  let hasUnassigned = false;
  for (const s of snags) {
    const name = s.assigned_to?.trim();
    if (!name) hasUnassigned = true;
    else if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
  }
  const sorted = [...names.values()].sort((a, b) => a.localeCompare(b));
  return hasUnassigned ? [...sorted, UNASSIGNED] : sorted;
}

function assigneeOf(snag: Pick<Snag, "assigned_to">): string {
  return snag.assigned_to?.trim() || UNASSIGNED;
}

/** Apply the status and assignee filters. Keeps snag-number order. */
export function filterSnags<T extends Pick<Snag, "status" | "assigned_to">>(snags: T[], options: ReportOptions): T[] {
  const wanted = new Set(options.assignees.map((a) => a.toLowerCase()));
  return snags.filter((s) => {
    if (options.status === "outstanding" && s.status === "resolved") return false;
    if (options.status === "resolved" && s.status !== "resolved") return false;
    if (wanted.size && !wanted.has(assigneeOf(s).toLowerCase())) return false;
    return true;
  });
}

export type SnagGroup<T> = { label: string | null; snags: T[] };

/** Split snags into headed sections. "none" gives one section with no heading. */
export function groupSnags<T extends Pick<Snag, "status" | "assigned_to" | "level_id">>(
  snags: T[],
  groupBy: GroupBy,
  levels: { id: string; name: string }[] = [],
): SnagGroup<T>[] {
  if (groupBy === "none") return [{ label: null, snags }];

  if (groupBy === "level") {
    const known = new Set(levels.map((l) => l.id));
    return [
      ...levels.map((l) => ({ label: l.name, snags: snags.filter((s) => s.level_id === l.id) })),
      { label: NO_LEVEL, snags: snags.filter((s) => !s.level_id || !known.has(s.level_id)) },
    ].filter((g) => g.snags.length > 0);
  }

  if (groupBy === "status") {
    return STATUS_ORDER.map((status) => ({
      label: SNAG_STATUS_LABEL[status],
      snags: snags.filter((s) => s.status === status),
    })).filter((g) => g.snags.length > 0);
  }

  return listAssignees(snags).map((name) => ({
    label: name,
    snags: snags.filter((s) => assigneeOf(s).toLowerCase() === name.toLowerCase()),
  }));
}

/** One line describing any filters, printed in the report header. Null if unfiltered. */
export function describeFilters(options: ReportOptions): string | null {
  const parts: string[] = [];
  if (options.status === "outstanding") parts.push("Outstanding snags only (open and in progress)");
  if (options.status === "resolved") parts.push("Resolved snags only");
  if (options.assignees.length) parts.push(`Assigned to: ${options.assignees.join(", ")}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Whether a design shows photos, and how big (longest edge, px) to fetch them. */
export function photoSizeFor(design: ReportDesign): number | null {
  if (design === "checklist") return null;
  return design === "photos" ? 1000 : 320;
}

// ---------------------------------------------------------------------------
// Remembered choices (per device). Only the "house style" is remembered:
// design, grouping and who prepared it. Filters are per report, so they reset.
// ---------------------------------------------------------------------------
const STORAGE_KEY = "snaglist.report-options.v1";
type Remembered = Pick<ReportOptions, "design" | "groupBy" | "preparedBy" | "includePlans">;

export function loadRememberedOptions(): ReportOptions {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Remembered>;
    return {
      ...DEFAULT_REPORT_OPTIONS,
      design: DESIGNS.some((d) => d.value === saved.design) ? saved.design! : DEFAULT_REPORT_OPTIONS.design,
      groupBy: GROUP_BY_OPTIONS.some((g) => g.value === saved.groupBy) ? saved.groupBy! : DEFAULT_REPORT_OPTIONS.groupBy,
      preparedBy: typeof saved.preparedBy === "string" ? saved.preparedBy : "",
      includePlans: saved.includePlans !== false,
    };
  } catch {
    return DEFAULT_REPORT_OPTIONS;
  }
}

export function rememberOptions(options: ReportOptions) {
  try {
    const { design, groupBy, preparedBy, includePlans } = options;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ design, groupBy, preparedBy, includePlans } satisfies Remembered));
  } catch {
    // Private browsing / storage blocked: just don't remember.
  }
}
