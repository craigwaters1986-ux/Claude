/**
 * The PDF report layout (@react-pdf/renderer).
 *
 * This file is loaded on demand (see generate-report.ts) so the PDF engine,
 * which is large, isn't downloaded until someone taps "Generate report".
 *
 * Unlike a screenshot-based PDF (html2canvas), this is laid out as a real
 * document: text is sharp and selectable, rows never split across pages, and
 * the table header repeats on every page.
 */
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import { SNAG_STATUS_LABEL, type ProjectSummary, type Snag, type SnagStatus } from "@/types/models";

export type ReportData = {
  project: ProjectSummary;
  snags: Snag[];
  /** snag id → JPEG/PNG data URL thumbnail. Missing = no photo. */
  thumbnails: Record<string, string>;
  generatedAt: Date;
};

// Don't break words with hyphens ("skir-ting"); wrap whole words only.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#171717";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";

const STATUS_COLOURS: Record<SnagStatus, { bg: string; fg: string }> = {
  open: { bg: "#fee2e2", fg: "#991b1b" },
  in_progress: { bg: "#fef3c7", fg: "#92400e" },
  resolved: { bg: "#d1fae5", fg: "#065f46" },
};

// Column widths (points). A4 is 595pt wide; minus 2 × 32pt margins = 531pt.
const COL = { id: 30, photo: 92, title: 118, assigned: 86, status: 68 }; // comments takes the rest

// Note: no custom lineHeight anywhere. In this version of react-pdf it roughly
// doubles the gap between wrapped lines; the default spacing reads well.
const styles = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 48, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: INK },

  // Header
  eyebrow: { fontSize: 8, letterSpacing: 1.2, color: MUTED, textTransform: "uppercase" },
  projectName: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 4 },
  meta: { marginTop: 3, color: MUTED },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dateBox: { alignItems: "flex-end" },
  dateValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 4 },

  stats: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 16 },
  stat: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10 },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 8, color: MUTED, marginTop: 2 },

  // Table
  tableHeader: { flexDirection: "row", backgroundColor: INK, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, borderRadius: 3 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, minHeight: 78 },
  cell: { paddingVertical: 7, paddingHorizontal: 6 },
  headCell: { paddingVertical: 6, paddingHorizontal: 6 },
  id: { width: COL.id, fontFamily: "Helvetica-Bold" },
  photo: { width: COL.photo },
  title: { width: COL.title },
  assigned: { width: COL.assigned },
  comments: { flex: 1 },
  status: { width: COL.status },

  thumb: { width: 80, height: 62, objectFit: "cover", borderRadius: 3 },
  noThumb: { width: 80, height: 62, borderRadius: 3, borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  noThumbText: { fontSize: 7, color: MUTED },
  titleText: { fontFamily: "Helvetica-Bold" },
  bodyText: {},
  subtle: { color: MUTED, fontSize: 8, marginTop: 3 },
  pill: { alignSelf: "flex-start", borderRadius: 8, paddingVertical: 2.5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  empty: { paddingVertical: 24, textAlign: "center", color: MUTED },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6 },
});

function Stat({ value, label, colour }: { value: number; label: string; colour?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={colour ? [styles.statValue, { color: colour }] : styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function SnagReport({ project, snags, thumbnails, generatedAt }: ReportData) {
  const count = (status: SnagStatus) => snags.filter((s) => s.status === status).length;

  return (
    <Document
      title={`Snagging report: ${project.name}`}
      subject="Snagging report"
      creator="SnagList"
      producer="SnagList"
    >
      <Page size="A4" style={styles.page}>
        {/* ---- Report header (first page only) ---- */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={styles.eyebrow}>Snagging report</Text>
            <Text style={styles.projectName}>{project.name}</Text>
            {project.location ? <Text style={styles.meta}>{project.location}</Text> : null}
            {project.description ? <Text style={styles.meta}>{project.description}</Text> : null}
          </View>
          <View style={styles.dateBox}>
            <Text style={styles.eyebrow}>Date</Text>
            <Text style={styles.dateValue}>{formatDate(generatedAt)}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <Stat value={snags.length} label="Total issues" />
          <Stat value={count("open")} label="Open" colour={STATUS_COLOURS.open.fg} />
          <Stat value={count("in_progress")} label="In progress" colour={STATUS_COLOURS.in_progress.fg} />
          <Stat value={count("resolved")} label="Resolved" colour={STATUS_COLOURS.resolved.fg} />
        </View>

        {/* ---- Table header: `fixed` repeats it at the top of every page ---- */}
        <View style={styles.tableHeader} fixed>
          <Text style={[styles.headCell, styles.id]}>#</Text>
          <Text style={[styles.headCell, styles.photo]}>Photo</Text>
          <Text style={[styles.headCell, styles.title]}>Title</Text>
          <Text style={[styles.headCell, styles.assigned]}>Assigned to</Text>
          <Text style={[styles.headCell, styles.comments]}>Comments</Text>
          <Text style={[styles.headCell, styles.status]}>Status</Text>
        </View>

        {snags.length === 0 ? <Text style={styles.empty}>No snags have been logged for this project.</Text> : null}

        {snags.map((snag) => {
          const colours = STATUS_COLOURS[snag.status];
          const thumb = thumbnails[snag.id];
          return (
            // wrap={false}: a row moves to the next page whole rather than splitting.
            <View key={snag.id} style={styles.row} wrap={false}>
              <Text style={[styles.cell, styles.id]}>{snag.snag_number}</Text>
              <View style={[styles.cell, styles.photo]}>
                {thumb ? (
                  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
                  <Image src={thumb} style={styles.thumb} />
                ) : (
                  <View style={styles.noThumb}>
                    <Text style={styles.noThumbText}>No photo</Text>
                  </View>
                )}
              </View>
              <View style={[styles.cell, styles.title]}>
                <Text style={styles.titleText}>{snag.title}</Text>
                {snag.location_details ? <Text style={styles.subtle}>{snag.location_details}</Text> : null}
                <Text style={styles.subtle}>Logged {formatDate(snag.created_at)}</Text>
              </View>
              <Text style={[styles.cell, styles.assigned, styles.bodyText]}>{snag.assigned_to || "—"}</Text>
              <Text style={[styles.cell, styles.comments, styles.bodyText]}>{snag.description || "—"}</Text>
              <View style={[styles.cell, styles.status]}>
                <Text style={[styles.pill, { backgroundColor: colours.bg, color: colours.fg }]}>
                  {SNAG_STATUS_LABEL[snag.status]}
                </Text>
                {snag.resolved_at ? <Text style={styles.subtle}>{formatDate(snag.resolved_at)}</Text> : null}
              </View>
            </View>
          );
        })}

        {/* ---- Footer on every page ---- */}
        <View style={styles.footer} fixed>
          <Text>
            {project.name} · Snagging report · {formatDate(generatedAt)}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render the report to a PDF Blob, in the browser. */
export function renderSnagReport(data: ReportData): Promise<Blob> {
  return pdf(<SnagReport {...data} />).toBlob();
}
