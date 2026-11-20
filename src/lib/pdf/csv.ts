/**
 * Spreadsheet export: the same issues as the report (same filters and order),
 * one row each, as CSV that opens cleanly in Excel, Numbers and Google Sheets.
 */
import { SNAG_STATUS_LABEL, type Level, type Snag } from "@/types/models";
import { filterSnags, groupSnags, type ReportOptions } from "./report-options";

const HEADERS = [
  "Issue #",
  "Title",
  "Status",
  "Assigned to",
  "Comments",
  "Level",
  "Location",
  "Logged",
  "Resolved",
  "Photos",
  "Photo links",
];

/** Quote a value for CSV, and stop spreadsheets treating it as a formula. */
function cell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const isoDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function buildIssuesCsv(snags: Snag[], levels: Pick<Level, "id" | "name">[], options: ReportOptions): string {
  const levelNames = new Map(levels.map((l) => [l.id, l.name]));
  const ordered = groupSnags(filterSnags(snags, options), options.groupBy, levels).flatMap((g) => g.snags);
  const rows = ordered.map((s) =>
    [
      s.snag_number,
      s.title,
      SNAG_STATUS_LABEL[s.status],
      s.assigned_to,
      s.description,
      s.level_id ? levelNames.get(s.level_id) : "",
      s.location_details,
      isoDate(s.created_at),
      isoDate(s.resolved_at),
      s.photos.length,
      s.photos.map((p) => p.image_url).join(" "),
    ]
      .map(cell)
      .join(","),
  );
  // Byte-order mark so Excel reads £, é etc. correctly; CRLF line ends for Windows.
  return "﻿" + [HEADERS.join(","), ...rows].join("\r\n") + "\r\n";
}
