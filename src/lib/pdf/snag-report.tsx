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
import { SNAG_STATUS_LABEL, type Level, type ProjectSummary, type Snag, type SnagStatus } from "@/types/models";
import { DESIGNS, describeFilters, filterSnags, groupSnags, type ReportOptions, type SnagGroup } from "./report-options";

export type ReportData = {
  project: ProjectSummary;
  /** All of the project's snags; options decide which are shown. */
  snags: Snag[];
  /** The project's levels, in order. */
  levels: Level[];
  /** level id → drawing as a JPEG data URL, for the marked-up plan pages. */
  plans: Record<string, string>;
  /** photo id → JPEG/PNG data URL, for the photos the design shows. */
  thumbnails: Record<string, string>;
  /** snag id → JPEG data URL: a cut-out of the drawing around the snag's pin. */
  snippets: Record<string, string>;
  /** From Settings → Reports. */
  branding: { companyName: string; logo: string | null };
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

/** Diameter of a snag pin on a plan page, in points. */
const PIN_SIZE = 15;

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
  cardWrap: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  card: { flexDirection: "row", gap: 14 },
  // Up to 5 extra photos under the card: 5 × 98pt + 4 × 6pt gaps ≈ the 531pt content width.
  extras: { flexDirection: "row", gap: 6, marginTop: 8 },
  extraPhoto: { width: 98, height: 74, objectFit: "cover", borderRadius: 3 },
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

  // Branding and location snippets
  logo: { maxWidth: 140, maxHeight: 48, objectFit: "contain", marginBottom: 8 },
  snippetSmall: { width: 80, height: 60, borderRadius: 3, marginTop: 4, borderWidth: 1, borderColor: LINE },
  snippetLarge: { width: 160, height: 120, borderRadius: 3, marginTop: 3, borderWidth: 1, borderColor: LINE },

  // Plan pages
  planHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10, height: 36 },
  planTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", marginTop: 3 },
  legend: { flexDirection: "row", gap: 12, fontSize: 8, color: MUTED },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  planPin: { position: "absolute", width: PIN_SIZE, height: PIN_SIZE, borderRadius: PIN_SIZE / 2, borderWidth: 1, borderColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  planPinText: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: "#ffffff" },

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

function ReportHeader({
  project,
  snags,
  generatedAt,
  options,
  branding,
}: Pick<ReportData, "project" | "snags" | "generatedAt" | "options" | "branding">) {
  const count = (status: SnagStatus) => snags.filter((s) => s.status === status).length;
  const filterNote = describeFilters(options);

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={styles.eyebrow}>
            {branding.companyName ? `${branding.companyName} · ` : ""}
            {options.design === "checklist" ? "Snagging checklist" : "Snagging report"}
          </Text>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.location ? <Text style={styles.meta}>{project.location}</Text> : null}
          {project.description ? <Text style={styles.meta}>{project.description}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {branding.logo ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
            <Image src={branding.logo} style={styles.logo} />
          ) : null}
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

type RowProps = { snag: Snag; thumbnails: Record<string, string>; levelName?: string; snippet?: string };

function StandardTableRow({ snag, thumbnails, levelName, snippet }: RowProps) {
  const cover = snag.photos[0] ? thumbnails[snag.photos[0].id] : undefined;
  return (
    <View style={styles.row} wrap={false}>
      <Text style={[styles.cell, styles.idText, { width: TABLE_COL.id }]}>{snag.snag_number}</Text>
      <View style={[styles.cell, { width: TABLE_COL.photo }]}>
        {cover ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
          <Image src={cover} style={styles.thumb} />
        ) : (
          <View style={styles.noThumb}>
            <Text style={styles.noThumbText}>No photo</Text>
          </View>
        )}
        {snag.photos.length > 1 ? (
          <Text style={styles.subtle}>
            +{snag.photos.length - 1} more {snag.photos.length === 2 ? "photo" : "photos"}
          </Text>
        ) : null}
        {snippet ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
          <Image src={snippet} style={styles.snippetSmall} />
        ) : null}
      </View>
      <View style={[styles.cell, { width: TABLE_COL.title }]}>
        <Text style={styles.titleText}>{snag.title}</Text>
        {levelName ? <Text style={styles.subtle}>{levelName}</Text> : null}
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
function PhotoCard({ snag, thumbnails, levelName, snippet }: RowProps) {
  const [first, ...rest] = snag.photos;
  const cover = first ? thumbnails[first.id] : undefined;
  const extras = rest.map((p) => thumbnails[p.id]).filter((src): src is string => !!src);
  return (
    <View style={styles.cardWrap} wrap={false}>
      <View style={styles.card}>
        {cover ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
          <Image src={cover} style={styles.cardPhoto} />
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

          {levelName ? (
            <>
              <Text style={styles.fieldLabel}>Level</Text>
              <Text style={styles.fieldValue}>{levelName}</Text>
            </>
          ) : null}
  
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

          {snippet ? (
            <>
              <Text style={styles.fieldLabel}>Where</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
              <Image src={snippet} style={styles.snippetLarge} />
            </>
          ) : null}
        </View>
      </View>
      {extras.length ? (
        <View style={styles.extras}>
          {extras.map((src, k) => (
            // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
            <Image key={k} src={src} style={styles.extraPhoto} />
          ))}
        </View>
      ) : null}
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

function ChecklistRow({ snag, levelName, snippet }: { snag: Snag; levelName?: string; snippet?: string }) {
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
        {levelName ? <Text style={styles.subtle}>{levelName}</Text> : null}
        {snag.location_details ? <Text style={styles.subtle}>{snag.location_details}</Text> : null}
        {snippet ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop
          <Image src={snippet} style={styles.snippetSmall} />
        ) : null}
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
// Marked-up plan: a level's drawing with its snags pinned on it
// ---------------------------------------------------------------------------
const PIN_COLOUR: Record<SnagStatus, string> = { open: "#dc2626", in_progress: "#f59e0b", resolved: "#059669" };

function PlanPage({
  level,
  src,
  snags,
  project,
  generatedAt,
  design,
}: {
  level: Level;
  src: string;
  snags: Snag[];
  project: ProjectSummary;
  generatedAt: Date;
  design: ReportOptions["design"];
}) {
  const ratio = (level.drawing_width ?? 4) / (level.drawing_height ?? 3);
  const landscape = ratio > 1;
  // A4 in points, minus the page padding (32 each side; 32 top, 48 bottom) and the heading block.
  const availW = (landscape ? 842 : 595) - 64;
  const availH = (landscape ? 595 : 842) - 80 - 58;
  const w = Math.min(availW, availH * ratio);
  const h = w / ratio;

  return (
    <Page size="A4" orientation={landscape ? "landscape" : "portrait"} style={styles.page}>
      <View style={styles.planHeading}>
        <View>
          <Text style={styles.eyebrow}>Plan</Text>
          <Text style={styles.planTitle}>{level.name}</Text>
        </View>
        <View style={styles.legend}>
          {(["open", "in_progress", "resolved"] as const).map((st) => (
            <View key={st} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: PIN_COLOUR[st] }]} />
              <Text>
                {SNAG_STATUS_LABEL[st]} ({snags.filter((sn) => sn.status === st).length})
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ width: w, height: h, alignSelf: "center", borderWidth: 1, borderColor: LINE }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image has no alt prop */}
        <Image src={src} style={{ width: w, height: h }} />
        {snags.map((sn) => (
          <View
            key={sn.id}
            style={[
              styles.planPin,
              { left: sn.pin_x! * w - PIN_SIZE / 2, top: sn.pin_y! * h - PIN_SIZE / 2, backgroundColor: PIN_COLOUR[sn.status] },
            ]}
          >
            <Text style={styles.planPinText}>{sn.snag_number}</Text>
          </View>
        ))}
      </View>

      <Footer project={project} generatedAt={generatedAt} design={design} />
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function SnagReport({ project, snags: allSnags, levels, plans, thumbnails, snippets, branding, generatedAt, options }: ReportData) {
  const snags = filterSnags(allSnags, options);
  const groups = groupSnags(snags, options.groupBy, levels);
  const levelNames = new Map(levels.map((l) => [l.id, l.name]));
  // When grouped by level the heading already says it.
  const levelOf = (snag: Snag) => (options.groupBy === "level" || !snag.level_id ? undefined : levelNames.get(snag.level_id));
  const planPages = levels.filter((l) => plans[l.id]);
  const designLabel = DESIGNS.find((d) => d.value === options.design)?.label ?? "Report";

  return (
    <Document
      title={`${designLabel}: ${project.name}`}
      subject="Snagging report"
      creator="Site Auditor +"
      producer="Site Auditor +"
      author={options.preparedBy || undefined}
    >
      <Page size="A4" style={styles.page}>
        <ReportHeader project={project} snags={snags} generatedAt={generatedAt} options={options} branding={branding} />

        {options.design === "table" ? <StandardTableHeader /> : null}
        {options.design === "checklist" ? <ChecklistHeader /> : null}

        {snags.length === 0 ? (
          <Text style={styles.empty}>No snags match the options chosen for this report.</Text>
        ) : (
          <Groups
            groups={groups}
            renderSnag={(snag) =>
              options.design === "photos" ? (
                <PhotoCard snag={snag} thumbnails={thumbnails} levelName={levelOf(snag)} snippet={snippets[snag.id]} />
              ) : options.design === "checklist" ? (
                <ChecklistRow snag={snag} levelName={levelOf(snag)} snippet={snippets[snag.id]} />
              ) : (
                <StandardTableRow snag={snag} thumbnails={thumbnails} levelName={levelOf(snag)} snippet={snippets[snag.id]} />
              )
            }
          />
        )}

        {options.design === "checklist" && snags.length > 0 ? <ChecklistSignOff /> : null}

        <Footer project={project} generatedAt={generatedAt} design={options.design} />
      </Page>

      {planPages.map((level) => (
        <PlanPage
          key={level.id}
          level={level}
          src={plans[level.id]}
          snags={snags.filter((sn) => sn.level_id === level.id && sn.pin_x != null && sn.pin_y != null)}
          project={project}
          generatedAt={generatedAt}
          design={options.design}
        />
      ))}
    </Document>
  );
}

/** Render the report to a PDF Blob, in the browser. */
export function renderSnagReport(data: ReportData): Promise<Blob> {
  return pdf(<SnagReport {...data} />).toBlob();
}
