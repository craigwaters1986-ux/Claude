/**
 * Central query-key factory. Every cache entry is named here, so
 * invalidation can't drift out of sync with how data is fetched.
 *
 *   ["projects"]                     → everything project-related
 *   ["projects", "list"]             → dashboard list
 *   ["projects", "detail", id]       → one project + counts
 *   ["snags", projectId]             → a project's snag list
 *   ["levels", projectId]            → a project's levels and drawings
 */
export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
};

export const snagKeys = {
  all: ["snags"] as const,
  list: (projectId: string) => [...snagKeys.all, projectId] as const,
};

export const levelKeys = {
  all: ["levels"] as const,
  list: (projectId: string) => [...levelKeys.all, projectId] as const,
};

export const settingsKeys = {
  mine: ["settings"] as const,
};

export const userStateKeys = {
  mine: ["user-state"] as const,
};

export const mutationKeys = {
  createSnag: (projectId: string) => ["create-snag", projectId] as const,
};
