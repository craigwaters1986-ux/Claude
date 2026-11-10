/**
 * App-level domain types. Components import from here, not from database.ts,
 * so the UI doesn't depend on the exact shape of generated DB types.
 */
import type { Enums, Tables, TablesInsert, TablesUpdate } from "./database";

export type ProjectStatus = Enums<"project_status">;
export type SnagStatus = Enums<"snag_status">;

export type Project = Tables<"projects">;
/** A snag row as stored. Its image_url/image_path are the cover (first photo). */
export type SnagRow = Tables<"snags">;
export type SnagPhoto = Tables<"snag_photos">;
/** A snag with all its photos, in order. What the app works with. */
export type Snag = SnagRow & { photos: SnagPhoto[] };

/** Most photos the app lets you attach to one snag. */
export const MAX_PHOTOS_PER_SNAG = 6;

export type ProjectSummary = Project & {
  total_snags: number;
  open_snags: number;
  in_progress_snags: number;
  resolved_snags: number;
};

/** Fields a user can set when creating/editing a project. */
export type ProjectInput = Pick<
  TablesInsert<"projects">,
  "name" | "description" | "location" | "status"
>;
export type ProjectPatch = Partial<ProjectInput>;

/** Fields a user can set when creating a snag (number & owner are server-side). */
export type SnagInput = Pick<
  TablesInsert<"snags">,
  | "project_id"
  | "title"
  | "description"
  | "location_details"
  | "assigned_to"
  | "status"
>;
export type SnagPatch = Pick<
  TablesUpdate<"snags">,
  "title" | "description" | "location_details" | "assigned_to" | "status"
>;
/** A photo already uploaded to Storage, ready to attach to a snag. */
export type SnagPhotoInput = Pick<SnagPhoto, "id" | "position" | "image_url" | "image_path">;

/**
 * A snag shown in the list before the server has confirmed it
 * (optimistic UI during Rapid Entry).
 */
export type ListedSnag = Snag & { _pending?: boolean };

export const SNAG_STATUSES: readonly SnagStatus[] = ["open", "in_progress", "resolved"];
export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "active",
  "on_hold",
  "completed",
  "archived",
];

export const SNAG_STATUS_LABEL: Record<SnagStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};
