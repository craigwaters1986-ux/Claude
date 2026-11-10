/**
 * The PDF report layouts (@react-pdf/renderer).
 *
 * This file is loaded on demand (see generate-report.ts) so the PDF engine,
 * which is large, isn't downloaded until someone generates a report.
 *
 * Three designs share one header and footer:
 *   - table:     every snag in one table with a small photo (the original report)
 *   - photos:    a card per snag with a large photo, for clients
 *   - checklist: a dense table with no photos and tick boxes, for trades on site
 *
 * Text is real text (sharp, selectable), rows/cards never split across pages,
 * and table headers repeat on every page.
 */
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format";
import { SNAG_STATUS_LABEL, type ProjectSummary, type Snag, type SnagStatus } from "@/types/models";
import { DESIGNS, describeFilters, filterSnags, groupSnags, type ReportOptions, type SnagGroup } from "./report-options";

export type ReportData = {
  project: ProjectSummary;
  /** All of the project's snags; options decide which are shown. */
  snags: Snag[];
  /** snag id → JPEG/PNG data URL. Missing = no photo. */
  thumbnails: Record<string, string>;
  generatedAt: Date;
  options: ReportOptions;
};

// Don't break words with hyphens ("skir-ting"); wrap whole words only.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#171717";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const SOFT = "#f5f5f5";

const STATUS_COLOURS: Record<SnagStatus, { bg: string; fg: string }> = {
  open: { bg: "#fee2e2", fg: "#991b1b" },
  in_progress: { bg: "#fef3c7", fg: "#92400e" },
  resolved: { bg: "#d1fae5", fg: "#065f46" },
};

// Note: no custom lineHeight anywhere. In this version of react-pdf it roughly
// doubles the gap between wrapped lines; the default spacing reads well.
const styles = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 48, paddingHorizontal: 32, fontFamily: "Helvetica", fontSize: 9, color: INK },

  // Header
  eyebrow: { fontSize: 8, letterSpacing: 1.2, color: MUTED, textTransform: "uppercase" },
  projectName: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 4 },
  meta: { marginTop: 3, color: MUTED },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerRight: { alignItems: "flex-end", maxWidth: 180 },
  dateValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 4 },
  people: { flexDirection: "row", gap: 24, marginTop: 10 },
  personValue: { fontSize: 10, fontFamily: "Helvetica-Bold", marginTop: 3 },
  filterNote: { marginTop: 10, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: SOFT, borderRadius: 3, color: MUTED, fontSize: 8 },

  stats: { flexDirection: "row", gap: 8, marginTop: 14, marginBottom: 16 },
  stat: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 10 },
  statValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  statLabel: { fontSize: 8, color: MUTED, marginTop: 2 },

  groupHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 14, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1.5, borderBottomColor: INK },
  groupTitle: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  groupCount: { fontSize: 8, color: MUTED },

  // Shared table bits
  tableHeader: { flexDirection: "row", backgroundColor: INK, color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8, borderRadius: 3 },
  headCell: { paddingVertical: 6, paddingHorizontal: 6 },
  cell: { paddingVertical: 7, paddingHorizontal: 6 },
  idText: { fontFamily: "Helvetica-Bold" },
  titleText: { fontFamily: "Helvetica-Bold" },
  subtle: { color: MUTED, fontSize: 8, marginTop: 3 },
  pill: { alignSelf: "flex-start", borderRadius: 8, paddingVertical: 2.5, paddingHorizontal: 6, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  empty: { paddingVertical: 24, textAlign: "center", color: MUTED },

  // Standard table
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, minHeight: 78 },
  thumb: { width: 80, height: 62, objectFit: "cover", borderRadius: 3 },
  noThumb: { width: 80, height: 62, borderRadius: 3, borderWidth: 1, borderColor: LINE, alignItems: "center", justifyContent: "center" },
  noThumbText: { fontSize: 7, color: MUTED },

  // Photo report
  card: { flexDirection: "row", gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  cardPhoto: { width: 250, height: 188, objectFit: "cover", borderRadius: 4 },
  cardNoPhoto: { width: 250, height: 188, borderRadius: 4, backgroundColor: SOFT, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardNumber: { fontSize: 8, color: MUTED, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  cardTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 3, marginBottom: 6 },
  fieldLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 8 },
  fieldValue: { fontSize: 9.5, marginTop: 2 },

  // Checklist
  checkRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, minHeight: 30, alignItems: "flex-start" },
  checkbox: { width: 12, height: 12, borderWidth: 1.2, borderColor: INK, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  // Helvetica (the built-in PDF font) has no ✓ character, so "done" is a filled square.
  checkboxFill: { width: 7, height: 7, backgroundColor: "#065f46", borderRadius: 1 },
  signLine: { borderBottomWidth: 1, borderBottomColor: "#9ca3af", height: 14, marginTop: 2 },
  signOff: { flexDirection: "row", gap: 24, marginTop: 24 },
  signOffBox: { flex: 1 },

  // Footer
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6 },
});

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

function StatusPill({ status }: { status: SnagStatus }) {
  const colours = STATUS_COLOURS[status];
  return <Text style={[styles.pill, { backgroundColor: colours.bg, color: colours.fg }]}>{SNAG_STATUS_LABEL[status]}</Text>;
}

function Stat({ value, label, colour }: { value: number; label: string; colour?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={colour ? [styles.statValue, { color: colour }] : styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ReportHeader({ project, snags, generatedAt, options }: Omit<ReportData, "thumbnails">) {
  const count = (status: SnagStatus) => snags.filter((s) => s.status === status).length;
  const filterNote = describeFilters(options);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={styles.eyebrow}>{options.design === "checklist" ? "Snagging checklist" : "Snagging report"}</Text>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.location ? <Text style={styles.meta}>{project.location}</Text> : null}
          {project.description ? <Text style={styles.meta}>{project.description}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.eyebrow}>Date</Text>
          <Text style={styles.dateValue}>{formatDate(generatedAt)}</Text>
        </View>
      </View>

      {options.preparedFor || options.preparedBy ? (
        <View style={styles.people}>
          {options.preparedFor ? (
            <View>
              <Text style={styles.eyebrow}>Prepared for</Text>
              <Text style={styles.personValue}>{options.preparedFor}</Text>
            </View>
          ) : null}
          {options.preparedBy ? (
            <View>
              <Text style={styles.eyebrow}>Prepared by</Text>
              <Text style={styles.personValue}>{options.preparedBy}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {filterNote ? <Text style={styles.filterNote}>{filterNote}</Text> : null}

      <View style={styles.stats}>
        <Stat value={snags.length} label={filterNote ? "Issues in this report" : "Total issues"} />
        <Stat value={count("open")} label="Open" colour={STATUS_COLOURS.open.fg} />
        <Stat value={count("in_progress")} label="In progress" colour={STATUS_COLOURS.in_progress.fg} />
        <Stat value={count("resolved")} label="Resolved" colour={STATUS_COLOURS.resolved.fg} />
      </View>
    </View>
  );
}

function GroupHeading({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.groupHeading}>
      <Text style={styles.groupTitle}>{label}</Text>
      <Text style={styles.groupCount}>
        {count} {count === 1 ? "snag" : "snags"}
      </Text>
    </View>
  );
}

function Footer({ project, generatedAt, design }: { project: ProjectSummary; generatedAt: Date; design: ReportOptions["design"] }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {project.name} · {design === "checklist" ? "Snagging checklist" : "Snagging report"} · {formatDate(generatedAt)}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

/**
 * Renders each group, with a heading when grouped. The heading and the group's
 * first snag sit in one unbreakable block, so a heading is never left alone at
 * the bottom of a page with its snags on the next.
 */
function Groups({ groups, renderSnag }: { groups: SnagGroup<Snag>[]; renderSnag: (snag: Snag) => React.ReactNode }) {
  return (
    <>
      {groups.map((group) =>
        group.snags.map((snag, i) =>
          group.label && i === 0 ? (
            <View key={snag.id} wrap={false}>
              <GroupHeading label={group.label} count={group.snags.length} />
              {renderSnag(snag)}
            </View>
          ) : (
            <View key={snag.id}>{renderSnag(snag)}</View>
          ),
        ),
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Design 1: Standard table
// ---------------------------------------------------------------------------
// A4 is 595pt wide; minus 2 × 32pt margins = 531pt.
const TABLE_COL = { id: 30, photo: 92, title: 118, assigned: 86, status: 68 }; // comments takes the rest

function StandardTableHeader() {
  return (
    <View style={styles.tableHeader} fixed>
      <Text style={[styles.headCell, { width: TABLE_COL.id }]}>#</Text>
      <Text style={[styles.headCell, { width: TABLE_COL.photo }]}>Photo</Text>
      <Text style={[styles.headCell, { width: TABLE_COL.title }]}>Title</Text>
      <Text style={[styles.headCell, { width: TABLE_COL.assigned }]}>Assigned to</Text>
      <Text style={[styles.headCell, { flex: 1 }]}>Comments</Text>
      <Text style={[styles.headCell, { width: TABLE_COL.status }]}>Status</Text>
    </View>
  );
}

function StandardTableRow({ snag, thumbnails }: { snag: Snag; thumbnails: Record<string, string> }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={[styles.cell, styles.idText, { width: TABLE_COL.id }]}>{snag.snag_number}</Text>
      <View style={[styles.cell, { width: TABLE_COL.photo }]}>
        {thumbnails[snag.id] ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
          <Image src={thumbnails[snag.id]} style={styles.thumb} />
        ) : (
          <View style={styles.noThumb}>
            <Text style={styles.noThumbText}>No photo</Text>
          </View>
        )}
      </View>
      <View style={[styles.cell, { width: TABLE_COL.title }]}>
        <Text style={styles.titleText}>{snag.title}</Text>
        {snag.location_details ? <Text style={styles.subtle}>{snag.location_details}</Text> : null}
        <Text style={styles.subtle}>Logged {formatDate(snag.created_at)}</Text>
      </View>
      <Text style={[styles.cell, { width: TABLE_COL.assigned }]}>{snag.assigned_to || "—"}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{snag.description || "—"}</Text>
      <View style={[styles.cell, { width: TABLE_COL.status }]}>
        <StatusPill status={snag.status} />
        {snag.resolved_at ? <Text style={styles.subtle}>{formatDate(snag.resolved_at)}</Text> : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design 2: Photo report
// ---------------------------------------------------------------------------
function PhotoCard({ snag, thumbnails }: { snag: Snag; thumbnails: Record<string, string> }) {
  return (
    <View style={styles.card} wrap={false}>
      {thumbnails[snag.id] ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
        <Image src={thumbnails[snag.id]} style={styles.cardPhoto} />
      ) : (
        <View style={styles.cardNoPhoto}>
          <Text style={styles.noThumbText}>No photo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardNumber}>SNAG #{snag.snag_number}</Text>
        <Text style={styles.cardTitle}>{snag.title}</Text>
        <StatusPill status={snag.status} />

        <Text style={styles.fieldLabel}>Assigned to</Text>
        <Text style={styles.fieldValue}>{snag.assigned_to || "—"}</Text>

        <Text style={styles.fieldLabel}>Comments</Text>
        <Text style={styles.fieldValue}>{snag.description || "—"}</Text>

        {snag.location_details ? (
          <>
            <Text style={styles.fieldLabel}>Location</Text>
            <Text style={styles.fieldValue}>{snag.location_details}</Text>
          </>
        ) : null}

        <Text style={styles.fieldLabel}>{snag.resolved_at ? "Logged / resolved" : "Logged"}</Text>
        <Text style={styles.fieldValue}>
          {formatDate(snag.created_at)}
          {snag.resolved_at ? ` / ${formatDate(snag.resolved_at)}` : ""}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Design 3: Checklist (for trades: tick when done, initial it)
// ---------------------------------------------------------------------------
const CHECK_COL = { done: 34, id: 30, title: 150, assigned: 90, status: 66, initials: 52 }; // comments takes the rest

function ChecklistHeader() {
  return (
    <View style={styles.tableHeader} fixed>
      <Text style={[styles.headCell, { width: CHECK_COL.done }]}>Done</Text>
      <Text style={[styles.headCell, { width: CHECK_COL.id }]}>#</Text>
      <Text style={[styles.headCell, { width: CHECK_COL.title }]}>Title</Text>
      <Text style={[styles.headCell, { width: CHECK_COL.assigned }]}>Assigned to</Text>
      <Text style={[styles.headCell, { flex: 1 }]}>Comments</Text>
      <Text style={[styles.headCell, { width: CHECK_COL.status }]}>Status</Text>
      <Text style={[styles.headCell, { width: CHECK_COL.initials }]}>Initials</Text>
    </View>
  );
}

function ChecklistRow({ snag }: { snag: Snag }) {
  return (
    <View style={styles.checkRow} wrap={false}>
      <View style={[styles.cell, { width: CHECK_COL.done }]}>
        <View style={styles.checkbox}>
          {snag.status === "resolved" ? <View style={styles.checkboxFill} /> : null}
        </View>
      </View>
      <Text style={[styles.cell, styles.idText, { width: CHECK_COL.id }]}>{snag.snag_number}</Text>
      <View style={[styles.cell, { width: CHECK_COL.title }]}>
        <Text style={styles.titleText}>{snag.title}</Text>
        {snag.location_details ? <Text style={styles.subtle}>{snag.location_details}</Text> : null}
      </View>
      <Text style={[styles.cell, { width: CHECK_COL.assigned }]}>{snag.assigned_to || "—"}</Text>
      <Text style={[styles.cell, { flex: 1 }]}>{snag.description || ""}</Text>
      <View style={[styles.cell, { width: CHECK_COL.status }]}>
        <StatusPill status={snag.status} />
      </View>
      <View style={[styles.cell, { width: CHECK_COL.initials }]}>
        <View style={styles.signLine} />
      </View>
    </View>
  );
}

function ChecklistSignOff() {
  return (
    <View style={styles.signOff} wrap={false}>
      {["Checked by", "Signature", "Date"].map((label) => (
        <View key={label} style={styles.signOffBox}>
          <Text style={styles.eyebrow}>{label}</Text>
          <View style={[styles.signLine, { height: 22 }]} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function SnagReport({ project, snags: allSnags, thumbnails, generatedAt, options }: ReportData) {
  const snags = filterSnags(allSnags, options);
  const groups = groupSnags(snags, options.groupBy);
  const designLabel = DESIGNS.find((d) => d.value === options.design)?.label ?? "Report";

  return (
    <Document
      title={`${designLabel}: ${project.name}`}
      subject="Snagging report"
      creator="SnagList"
      producer="SnagList"
      author={options.preparedBy || undefined}
    >
      <Page size="A4" style={styles.page}>
        <ReportHeader project={project} snags={snags} generatedAt={generatedAt} options={options} />

        {options.design === "table" ? <StandardTableHeader /> : null}
        {options.design === "checklist" ? <ChecklistHeader /> : null}

        {snags.length === 0 ? (
          <Text style={styles.empty}>No snags match the options chosen for this report.</Text>
        ) : (
          <Groups
            groups={groups}
            renderSnag={(snag) =>
              options.design === "photos" ? (
                <PhotoCard snag={snag} thumbnails={thumbnails} />
              ) : options.design === "checklist" ? (
                <ChecklistRow snag={snag} />
              ) : (
                <StandardTableRow snag={snag} thumbnails={thumbnails} />
              )
            }
          />
        )}

        {options.design === "checklist" && snags.length > 0 ? <ChecklistSignOff /> : null}

        <Footer project={project} generatedAt={generatedAt} design={options.design} />
      </Page>
    </Document>
  );
}

/** Render the report to a PDF Blob, in the browser. */
export function renderSnagReport(data: ReportData): Promise<Blob> {
  return pdf(<SnagReport {...data} />).toBlob();
}
